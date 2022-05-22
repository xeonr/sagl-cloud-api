import { Lifecycle, Request, RequestEvent, ResponseToolkit, Server } from '@hapi/hapi';
import { get } from 'config';
import * as Joi from 'joi';
import { Sequelize } from 'sequelize-typescript';

import * as accounts from './routes/account/accounts';
import * as auth from './routes/account/auth';
import * as gallery from './routes/gallery/gallery';
import * as config from './routes/saves/config';
import * as saves from './routes/saves/save';
import * as discord from './routes/servers/discord';
import * as mine from './routes/servers/personal';
import { validateAuth } from './util/Auth';
import { Logger } from './util/Logger';
import { RouterFn } from './util/Types';

const server: Server = new Server({
	host: get('web.host'),
	port: get('web.port'),
	routes: {
		cors: true,
		validate: {
			failAction: (_: Request, __: ResponseToolkit, err?: Error): Lifecycle.ReturnValue => {
				throw err;
			},
		},
	},
});

const routes: ((router: Server) => void)[] = [
	accounts.routes,
	auth.routes,
	mine.routes,
	saves.routes,
	gallery.routes,
	config.routes,
	discord.routes,
];

(async (): Promise<void> => {
	const db = new Sequelize({
		...get('database'),
		models: [`${__dirname}/models`],
	}); // tslint:disable-line

	// Point to docs.
	server.route({
		method: 'GET',
		path: '/',
		options: {
			auth: false,
		},
		handler(_: Request, h: ResponseToolkit) {
			return h.redirect('https://sagl.stoplight.io/docs/cloud-api/reference/Cloud-API.v1.yaml');
		},
	});

	await db.sync();

	server.validator(Joi);
	server.realm.modifiers.route.prefix = '/v1';

	server.events.on('request', (err: Request, listener: RequestEvent): void => {
		if (listener.error && (<any>listener.error).isServer) { // tslint:disable-line no-any
			// tslint:disable-next-line no-any
			Logger.error(`Error while accessing route ${err.route.path}`, { error: (<any>listener.error)!.stack });
			console.log(listener.error); // tslint:disable-line
		}
	});

	// Setup JWT
	await server.register(require('hapi-auth-jwt2')); // tslint:disable-line
	server.auth.strategy('jwt', 'jwt', {
		key: get('web.jwtToken'),
		validate: validateAuth,
	});

	server.auth.default('jwt');

	// Load all routes
	routes.forEach((r: RouterFn): void => { r(server); });

	// Boot server
	await server.start();

	Logger.info('Started server', {
		host: get('web.host'),
		port: get('web.port'),
		url: `http://${get('web.host')}:${get('web.port')}`, // tslint:disable-line
	});
})()
	.catch((e: Error): void => {
		console.log(e); // tslint:disable-line
		process.exit(0);
	});
