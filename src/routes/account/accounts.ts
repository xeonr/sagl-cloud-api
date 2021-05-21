import { Lifecycle, Server } from '@hapi/hapi';
import Joi from 'joi';

import { Request } from '../../util/Auth';
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
};
