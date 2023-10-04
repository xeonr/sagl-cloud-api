// @ts-ignore
import { Lifecycle, Request, RequestEvent, ResponseToolkit, Server } from '@hapi/hapi';
import Joi from 'joi';
import { Sequelize } from 'sequelize-typescript';

import * as accounts from './routes/account/accounts.js';
import * as auth from './routes/account/auth.js';
import * as gallery from './routes/gallery/gallery.js';
import * as config from './routes/saves/config.js';
import * as saves from './routes/saves/save.js';
import * as discord from './routes/servers/discord.js';
import * as mine from './routes/servers/personal.js';
import { validateAuth } from './util/Auth.js';
import { Logger } from './util/Logger.js';
import { RouterFn } from './util/Types.js';

import vaultConfig from 'config';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { Analytic } from './models/Analytic.js';
import { GalleryImage } from './models/GalleryImage.js';
import { GameConfig } from './models/GameConfig.js';
import { PersonalServer } from './models/PersonalServer.js';
import { SaveGameState } from './models/SaveGameState.js';
const server: Server = new Server({
	host: vaultConfig.get('web.host'),
	port: vaultConfig.get('web.port'),
	routes: {
		cors: {
			origin: ["*"],
			additionalHeaders: ['baggage', 'sentry-trace']
		},
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
const __dirname = fileURLToPath(new URL('.', import.meta.url));

(async (): Promise<void> => {
	console.log(`${__dirname}/models`);
	const db = new Sequelize({
		...vaultConfig.get('database'),
		models: [`${__dirname}models`],
	}); // tslint:disable-line

	db.addModels([User, Analytic, GalleryImage, GameConfig, PersonalServer, SaveGameState]);

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
	const hapiAuthJwt2 = await import('hapi-auth-jwt2');
	await server.register(hapiAuthJwt2); // tslint:disable-line
	server.auth.strategy('jwt', 'jwt', {
		key: vaultConfig.get('web.jwtToken'),
		validate: validateAuth,
	});

	server.auth.default('jwt');

	// Load all routes
	routes.forEach((r: RouterFn): void => { r(server); });

	// Boot server
	await server.start();

	Logger.info('Started server', {
		host: vaultConfig.get('web.host'),
		port: vaultConfig.get('web.port'),
		url: `http://${vaultConfig.get('web.host')}:${vaultConfig.get('web.port')}`, // tslint:disable-line
	});
})()
	.catch((e: Error): void => {
		console.log(e); // tslint:disable-line
		process.exit(0);
	});
