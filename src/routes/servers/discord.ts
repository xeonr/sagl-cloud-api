import { Lifecycle, Server } from '@hapi/hapi';

import { Request } from '../../util/Auth.js';
import { getDiscordToken, getGuilds } from '../../util/discord.js';
import { RouterFn } from '../../util/Types.js';
import { serverClient } from '../../util/serverApi.js';
import { FieldName, ListServersRequest, Operator } from '@buf/xeonr_sagl-servers.bufbuild_es/serversapi/v1/api_pb.js';

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/servers/discord',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const token = await getDiscordToken(request.auth.credentials.user);

			return serverClient.listServers(new ListServersRequest({
				requestType: {
					case: 'filter',
					value: {
						filter: [{
							field: FieldName.DISCORD_GUILD,
							operator: Operator.EQUAL,
							value: await getGuilds(token),
						}],
						limit: 100,
					}
				}
			})).then(async (r) => { // tslint:disable-line
				return r.server ?? [];
			});
		},
	});
};
