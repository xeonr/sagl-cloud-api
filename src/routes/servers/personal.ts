import { forbidden, notFound } from '@hapi/boom';
import { Lifecycle, ResponseToolkit, Server } from '@hapi/hapi';
import { createHash } from 'crypto';
import Joi from 'joi';
import { v4 } from 'uuid';

import { PersonalServer } from '../../models/PersonalServer';
import { Request } from '../../util/Auth';
import { RouterFn } from '../../util/Types';

function createSha(name: string, port: number): string {
	return createHash('sha1')
		.update(`${name.toLowerCase()}:${port}`)
		.digest('hex').toUpperCase();
}

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/servers/personal',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return PersonalServer.findAll({
				where: {
					userId: request.auth.credentials.user.id,
				},
				order: [['order', 'ASC']],
			});
		},
	});

	router.route({
		method: 'GET',
		path: '/servers/personal/{hash}',
		options: {
			validate: {
				params: {
					hash: Joi.string().length(40).uppercase().required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const currentSha: string = request.params.hash.toUpperCase();

			const server: PersonalServer | null = await PersonalServer.findOne({
				where: {
					hash: currentSha,
					userId: request.auth.credentials.user.id,
				},
			});

			if (!server) {
				throw notFound('Server not found');
			}

			return server;
		},
	});

	router.route({
		method: 'PUT',
		path: '/servers/personal/{hash}',
		options: {
			validate: {
				params: {
					hash: Joi.string().length(40).uppercase().required(),
				},
				payload: {
					address: Joi.string().max(50).required(),
					port: Joi.number().port().required(),
					description: Joi.string().allow(null).required(),
					serverPassword: Joi.string().allow(null).required(),
					rconPassword: Joi.string().allow(null).required(),
					order: Joi.number().required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const sha: string = createSha(request.payload.address, request.payload.port);

			const server: PersonalServer | null = await PersonalServer.findOne({
				where: {
					hash: request.params.hash,
					userId: request.auth.credentials.user.id,
				},
			});

			if (sha !== request.params.hash && await PersonalServer.count({
				where: {
					hash: sha,
					userId: request.auth.credentials.user.id,
				},
			}) >= 1) {
				throw forbidden('Server already exists');
			}

			if (server) {
				return server.update({
					id: server.id ?? v4(),
					hash: sha,
					...request.payload,
				});
			}

			return PersonalServer.create({
				id: v4(),
				hash: sha,
				userId: request.auth.credentials.user.id,
				...request.payload,
			});
		},
	});

	router.route({
		method: 'DELETE',
		path: '/servers/personal/{hash}',
		options: {
			validate: {
				params: {
					hash: Joi.string().length(40).uppercase().required(),
				},
			},
		},
		handler: async (request: Request, h: ResponseToolkit): Promise<Lifecycle.ReturnValue> => {
			await PersonalServer.destroy({
				where: {
					hash: request.params.hash.toUpperCase(),
					userId: request.auth.credentials.user.id,
				},
			});

			return h.response().code(204);
		},
	});
};
