import { forbidden, notFound } from '@hapi/boom';
import { Lifecycle, Server } from '@hapi/hapi';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import Joi from 'joi';
import { omit, pick } from 'lodash';

import { SaveGameState } from '../../models/SaveGameState';
import { Request } from '../../util/Auth';
import { S3 } from '../../util/S3';
import { SaveGame } from './../../models/SaveGame';
import { RouterFn } from './../../util/Types';

function getSavePath(userId: string, saveHash: string): string {
	return `saves/${userId}/${saveHash.substr(0, 2)}/${saveHash}`;
}

function hashFile(path: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = createHash('sha1');
		const stream = createReadStream(path);
		stream.on('data', d => hash.update(d));
		stream.on('end', () => { resolve(hash.digest('hex').toUpperCase()); });
		stream.on('error', () => { reject(); });
	});
}

function transformSave(userId: string, save: SaveGameState) {
	return {
		...omit(save.toJSON(), ['saveGameId', 'id', 'updatedAt']),
		cdnUrl: S3.getUrl(getSavePath(userId, save.hash)),
	};
}

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/saves',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return SaveGame.findAll({
				where: {
					userId: request.auth.credentials.user.id,
				},
				include: [{ model: SaveGameState, limit: 1, order: [['createdAt', 'desc']] }],
			}).then((games: SaveGame[]) => {
				return games.map((game: SaveGame) => omit({
					...game.toJSON(),
					current: game.states.length ? transformSave(request.auth.credentials.user.id, game.states[0]) : null,
				}, ['states', 'userId', 'updatedAt']));
			});
		},
	});

	router.route({
		method: 'POST',
		path: '/saves',
		options: {
			validate: {
				payload: {
					name: Joi.string().required(),
					version: Joi.string().required(),
					completed: Joi.number().required(),
					savedAt: Joi.date().required(),
					file: Joi.any().required(),
					saveId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
				},
			},
			payload: {
				maxBytes: 225 * 1000,
				output: 'stream',
				parse: true,
				multipart: {
					output: 'file',
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			let save: SaveGame;

			if (request.payload.saveId) {
				save = await SaveGame.findOne({
					where: {
						id: request.payload.saveId,
						userId: request.auth.credentials.user.id,
					},
				});

				if (!save) {
					throw forbidden('Save does not exist');
				}
			} else {
				save = await SaveGame.create({
					id: request.payload.saveId,
					userId: request.auth.credentials.user.id,
				});
			}

			const hash: string = await hashFile(request.payload.file.path);
			await S3.upload(getSavePath(request.auth.credentials.user.id, hash), createReadStream(request.payload.file.path));

			await SaveGameState.create({
				...pick(request.payload, ['name', 'version', 'completed', 'savedAt']),
				hash,
				saveGameId: save.id,
			});

			return {
				id: save.id,
			};
		},
	});

	router.route({
		method: 'GET',
		path: '/saves/{saveId}',
		options: {
			validate: {
				params: {
					saveId: Joi.string().uuid({ version: 'uuidv4' }).required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return SaveGame.findOne({
				where: {
					id: request.params.saveId,
					userId: request.auth.credentials.user.id,
				},
				include: [{ model: SaveGameState, limit: 10, order: [['createdAt', 'desc']] }],
			}).then((game: SaveGame | null) => {
				if (!game) {
					throw notFound('save not found');
				}

				return omit({
					...game.toJSON(),
					current: game.states.length ? transformSave(request.auth.credentials.user.id, game.states[0]) : null,
					states: game.states.map(i => transformSave(request.auth.credentials.user.id, i)),
				}, ['userId', 'updatedAt']);
			});
		},
	});
};
