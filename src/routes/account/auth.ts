import { forbidden } from '@hapi/boom';
import { Lifecycle, ResponseToolkit, Server } from '@hapi/hapi';
import { get } from 'config';
import got from 'got';
import Joi from 'joi';
import { sign } from 'jsonwebtoken';

import { User } from '../../models/User';
import { Request } from '../../util/Auth';
import { redisPub } from '../../util/Redis';
import { RouterFn } from './../../util/Types';


const page = `
<html>
<head>
	<title>Return to the app</title>
	<link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
	<style>
		* { background: #111; color: #FFF; font-family: "Open Sans", sans-serif; }
		p { text-align: center; color: rgba(255,255,255,0.5);  }
		p span { opacity: 1; }
		div { height: 100vh; display: flex; flex-direction: row; align-items: center; justify-content: center; font-size: 1.5em; }
	</style>
</head>
<body>
	<div>
		<p>Please <span>return to the app</span> to continue.</p>
	</div>
</body>
<html>
`;

function createRedirect(state: string): string {
	return 'https://discord.com/api/oauth2/authorize?'
		+ `client_id=${get('discord.clientId')}`
		+ `&redirect_uri=${get('discord.redirectUri')}`
		+ `&response_type=code`
		+ `&state=${state}`
		+ `&scope=${(get<string[]>('discord.scopes')).join(' ')}`;
}

function getToken(code: string): Promise<string> {
	return got.post(`https://discord.com/api/oauth2/token`, {
		form: {
			client_id: get('discord.clientId'),
			client_secret: get('discord.clientSecret'),
			redirect_uri: get('discord.redirectUri'),
			grant_type: 'authorization_code',
			scope: get<string[]>('discord.scopes').join(' '),
			code,
		},
		responseType: 'json',
	}).then((r: any): string => r.body.access_token); // tslint:disable-line no-any
}

export interface IDiscordUser {
	username: string;
	discriminator: string;
	id: string;
	email: string;
}

function getUser(accessToken: string): Promise<IDiscordUser> {
	return got.get(`https://discord.com/api/users/@me`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		responseType: 'json',
	}).then((r: any): IDiscordUser => { // tslint:disable-line no-any
		const { username, discriminator, id, email } = r.body;

		return {
			username,
			discriminator,
			id,
			email,
		};
	});
}

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/auth',
		options: {
			auth: false,
			validate: {
				query: {
					code: Joi.string().optional(),
					state: Joi.string().uuid({ version: 'uuidv4' }).required(),
				},
			},
		},
		handler: async (request: Request, h: ResponseToolkit): Promise<Lifecycle.ReturnValue> => {
			if (!request.query.code) {
				return h.redirect(createRedirect(request.query.state)).code(301);
			}

			const user: IDiscordUser = await getUser(await getToken(request.query.code));

			let account: User | null = await User.findOne({ where: { discordId: user.id } });
			if (account) {
				await account.update({
					discordUsername: user.username,
					discordDiscriminator: user.discriminator,
					discordId: user.id,
					email: user.email,
				});
			} else {
				account = await User.create({
					...(account ? account.toJSON() : {}),
					discordUsername: user.username,
					discordDiscriminator: user.discriminator,
					discordId: user.id,
					email: user.email,
				});
			}

			await redisPub.setex(`auth:${request.query.state}`, 60, JSON.stringify({ userId: account.id! }));

			return page.trim();
		},
	});

	router.route({
		method: 'POST',
		path: '/auth',
		options: {
			auth: false,
			validate: {
				payload: {
					state: Joi.string().uuid({ version: 'uuidv4' }).required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const val: string | null = await redisPub.get(`auth:${request.payload.state}`);

			if (!val) {
				throw forbidden('No such authentication attempt');
			}

			const { userId } = JSON.parse(val);
			const token: string = sign({ userId }, get('web.jwtToken'));

			return {
				jwt: token,
			};
		},
	});
};
