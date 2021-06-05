import { notFound } from '@hapi/boom';
import { Lifecycle, Server } from '@hapi/hapi';
import Joi from 'joi';
import { v4 } from 'uuid';

import { GameConfig } from '../../models/GameConfig';
import { Request } from '../../util/Auth';
import { RouterFn } from './../../util/Types';

const FILES: string[] = [
	'gta',
];

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/config/{file}',
		options: {
			validate: {
				params: {
					file: Joi.string().allow(...FILES).required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return GameConfig.findOne({
				where: {
					name: request.params.file,
					userId: request.auth.credentials.user.id,
				},
			}).then((config: GameConfig) => {
				if (!config) {
					throw notFound('Config key not set');
				}

				return config.value;
			});
		},
	});

	router.route({
		method: 'PUT',
		path: '/config/{file}',
		options: {
			validate: {
				params: {
					file: Joi.string().allow(...FILES).required(),
				},
				payload: {
					value: Joi.object().required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return GameConfig.findOne({
				where: {
					name: request.params.file,
					userId: request.auth.credentials.user.id,
				},
			}).then(async (config: GameConfig) => {
				if (config) {
					await config.update({ value: request.payload.value });
				} else {
					await GameConfig.create({
						id: v4(),
						name: request.params.file,
						value: request.payload.value,
						userId: request.auth.credentials.user.id,
					});
				}

				return request.payload.value;
			});
		},
	});
};
