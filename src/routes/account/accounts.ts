import { Lifecycle, Server } from '@hapi/hapi';
import Joi from 'joi';
import { post } from 'request-promise-native';

import { Request } from '../../util/Auth';
import { Logger } from '../../util/Logger';
import { Analytic } from './../../models/Analytic';
import { User } from './../../models/User';
import { RouterFn } from './../../util/Types';

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/account',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return request.auth.credentials.user;
		},
	});

	router.route({
		method: 'PATCH',
		path: '/account',
		options: {
			validate: {
				payload: {
					sampUsername: Joi.string().allow(null).required(),
					launcherSettings: Joi.object().default({}),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			await User.update(request.payload, { where: { id: request.auth.credentials.user.id } });

			return {
				...request.auth.credentials.user,
				...request.payload,
			};
		},
	});

	router.route({
		method: 'POST',
		path: '/science',
		options: {
			auth: { mode: 'optional' },
			validate: {
				payload: Joi.object({
					name: Joi.string().required(),
					payload: Joi.object().default({}),

					timezone: Joi.string().required(),
					osPlatform: Joi.string().required(),
					osRelease: Joi.string().required(),
					osVersion: Joi.string().required(),
					appVersion: Joi.string().required(),
					sampVersion: Joi.string().required(),
				}).required(),
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const analytic = await Analytic.create({
				...request.payload,
				userId: request.auth.credentials ? request.auth.credentials.user.id : null,
			});

			post('https://discord.com/api/webhooks/850523640893800449/RXT_F75zniUM12BvlQyx5mw5DNskSoUHgJ9ludvlOKXJn_NgXMMvCU7oF7bJiFVzomOv', {
				json: true,
				body: {
					username: '🧪',
					content: `**Tracked new event: ${request.payload.name}**`,
					embeds: [{
						color: 15501868,
						fields: Object.keys(analytic.toJSON()).map(i => {
							if (typeof analytic.toJSON()[i] === 'object') {
								return { name: i, value: `\`\`\`${JSON.stringify(analytic.toJSON()[i], null, 4)}\`\`\``, inline: false };
							}

							return { name: i, value: String(analytic.toJSON()[i]), inline: true };
						}),
					}],
				},
			}).catch(err => {
				Logger.warn('Unable to inform discord.', { err });
			});

			return {
				id: analytic.id,
			};
		},
	});
};
