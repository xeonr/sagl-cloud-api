import { Lifecycle, Server } from '@hapi/hapi';

import { Request } from '../../util/Auth';
import { RouterFn } from './../../util/Types';

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/account',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return request.auth.credentials.user;
		},
	});
};
