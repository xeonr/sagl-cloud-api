import { Lifecycle, Server } from '@hapi/hapi';
import Joi from 'joi';
import fetch from 'node-fetch'
import { v4 } from 'uuid';

import { Request } from '../../util/Auth.js';
import { Logger } from '../../util/Logger.js';
import { Analytic } from './../../models/Analytic.js';
import { User } from './../../models/User.js';
import { RouterFn } from './../../util/Types.js';

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
					sampUsername: Joi.string().allow(null),
					launcherSettings: Joi.object(),
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
					payload: Joi.any().default({}),
					machineId: Joi.string().required(),
					metrics: Joi.any().required(),
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
				id: v4(),
				userId: request.auth.credentials ? request.auth.credentials.user.id : null,
				ipAddress: request.headers['x-forwarded-for'] ?? request.info.remoteAddress,
			});
			console.log(JSON.stringify(request.headers));


			const data: any = analytic.toJSON(); // tslint:disable-line

			delete data.metrics;

			fetch('https://discord.com/api/webhooks/850523640893800449/RXT_F75zniUM12BvlQyx5mw5DNskSoUHgJ9ludvlOKXJn_NgXMMvCU7oF7bJiFVzomOv', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: '🧪',
					content: `**Tracked new event: ${request.payload.name}**`,
					embeds: [{
						color: 15501868,
						fields: Object.keys(data).map(i => {
							if (typeof data[i] === 'object') {
								return { name: i, value: `\`\`\`${JSON.stringify(data[i], null, 4)}\`\`\``, inline: false };
							}

							return { name: i, value: String(data[i]), inline: true };
						}),
					}],
				}),
			})
				.then(async (resp) => {
					if (resp.status  < 399) {
						throw await resp.text();
					}
			})
			.catch((err: Error | string) => {
				Logger.warn(`Unable to inform discord: ${typeof err === 'string' ? err : err?.message}`);
			});

			return {
				id: analytic.id,
			};
		},
	});
};
