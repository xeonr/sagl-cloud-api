import { forbidden } from '@hapi/boom';
import { Lifecycle, ResponseToolkit, Server } from '@hapi/hapi';
import { get } from 'config';
import got from 'got';
import Joi from 'joi';
import { sign } from 'jsonwebtoken';
import { v4 } from 'uuid';

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

function createRedirect(state: string, redirectUri: string = ''): string {
	return 'https://discord.com/api/oauth2/authorize?'
		+ `client_id=${get('discord.clientId')}`
		+ `&redirect_uri=${get('discord.redirectUri')}`
		+ `&response_type=code`
		+ `&prompt=none`
		+ `&state=${state}:${Buffer.from(redirectUri).toString('hex')}`
		+ `&scope=${(get<string[]>('discord.scopes')).join(' ')}`;
}

function getToken(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
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
	}).then((r: any) => ({ // tslint:disable-line no-any
		accessToken: r.body.access_token,
		refreshToken: r.body.refresh_token,
		expiresAt: new Date(+new Date() + (r.body.expires_in * 1000)),
	}));
}

export interface IDiscordUser {
	avatar: string;
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
		const { username, discriminator, id, email, avatar } = r.body;

		return {
			avatar: avatar ?
				`https://cdn.discordapp.com/avatars/${id}/${avatar}.png` :
				`https://cdn.discordapp.com/embed/avatars/${discriminator}.png`,
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
					redirectUri: Joi.string().optional(),
					code: Joi.string().optional(),
					state: Joi.string().required(),
				},
			},
		},
		handler: async (request: Request, h: ResponseToolkit): Promise<Lifecycle.ReturnValue> => {
			if (!request.query.code) {
				if (request.query.redirectUri) {
					return { redirectUrl: createRedirect(request.query.state, request.query.redirectUri) };
				}

				return h.redirect(createRedirect(request.query.state)).code(301);
			}

			const [state, redirectUri] = request.query.state.split(':');

			const { accessToken, refreshToken, expiresAt } = await getToken(request.query.code);
			const user: IDiscordUser = await getUser(accessToken);

			let account: User | null = await User.findOne({ where: { discordId: user.id } });
			if (account) {
				await account.update({
					discordAvatar: user.avatar,
					discordUsername: user.username,
					discordDiscriminator: user.discriminator,
					discordId: user.id,
					discordAccessToken: accessToken,
					discordRefreshToken: refreshToken,
					discordAccessExpiry: expiresAt,
					email: user.email,
				});
			} else {
				account = await User.create({
					id: v4(),
					...(account ? account.toJSON() : {}),
					discordAvatar: user.avatar,
					discordUsername: user.username,
					discordDiscriminator: user.discriminator,
					discordAccessToken: accessToken,
					discordRefreshToken: refreshToken,
					discordAccessExpiry: expiresAt,
					discordId: user.id,
					email: user.email,
				});
			}

			await redisPub.setex(`auth:${state}`, 60, JSON.stringify({ userId: account.id! }));

			if (redirectUri) {
				return h.redirect(Buffer.from(redirectUri, 'hex').toString());
			}

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
