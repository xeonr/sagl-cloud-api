import { get } from 'config';
import got from 'got';

import { User } from './../models/User';
import { redisPub } from './Redis';

export async function getDiscordToken(user: User): Promise<string> {
	const exists = await redisPub.get(`discord:${user.id}:access`);

	if (exists) {
		return exists;
	}

	return got.post(`https://discord.com/api/oauth2/token`, {
		form: {
			client_id: get('discord.clientId'),
			client_secret: get('discord.clientSecret'),
			grant_type: 'refresh_token',
			refresh_token: user.discordRefreshToken,
		},
		responseType: 'json',
	}).then(async (r: any) => { // tslint:disable-line
		await user.update({
			discordAccessToken: r.body.access_token,
			discordRefreshToken: r.body.refresh_token,
			discordAccessExpiry: new Date(+new Date() + (r.body.expires_in * 1000)),
		});

		await redisPub.setex(`discord:${user.id}:access`, r.body.expires_in, r.body.access_token);

		return r.body.access_token;
	});
}

export async function getGuilds(token: string): Promise<string[]> {
	return got.get(`https://discord.com/api/users/@me/guilds`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
		responseType: 'json',
	}).then(async (r: any) => { // tslint:disable-line
		return r.body.map(i => i.id);
	});
}
