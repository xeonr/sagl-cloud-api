import { Lifecycle, Server } from '@hapi/hapi';
import { get } from 'config';
import got from 'got';

import { Request } from '../../util/Auth';
import { getDiscordToken, getGuilds } from '../../util/discord';
import { RouterFn } from '../../util/Types';

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/servers/discord',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const token = await getDiscordToken(request.auth.credentials.user);
			const guilds = (await getGuilds(token)).map(i => `metadata.discordGuild=${i}`).join('&');

			return got.get(`${get('saglServerApi')}/v1/servers?limit=100&${guilds}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				responseType: 'json',
			}).then(async (r: any) => { // tslint:disable-line
				return r.body;
			});
		},
	});
};
