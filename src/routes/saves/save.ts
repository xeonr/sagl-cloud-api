import { Lifecycle, Server } from '@hapi/hapi';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import Joi from 'joi';
import { omit, pick } from 'lodash';

import { SaveGameState } from '../../models/SaveGameState';
import { Request } from '../../util/Auth';
import { S3 } from '../../util/S3';
import { RouterFn } from './../../util/Types';

function getSavePath(userId: string, slot: number, saveHash: string): string {
	return `saves/${userId}/${slot}/${saveHash.substr(0, 2)}/${saveHash}`;
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
		...omit(save.toJSON(), ['saveGameId', 'id', 'updatedAt', 'slot']),
		cdnUrl: S3.getUrl(getSavePath(userId, save.slot, save.hash)),
	};
}

const SLOTS: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/saves',
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return Promise.all(SLOTS.map((slot: number) => SaveGameState.findAll({
				where: {
					slot,
					userId: request.auth.credentials.user.id,
				},
				order: [['savedAt', 'DESC']],
				limit: 1,
			}).then(([game]: SaveGameState[]) => {
				if (!game) {
					return null;
				}

				return {
					slot: game.slot,
					current: transformSave(request.auth.credentials.user.id, game),
				};
			}))).then(r => r.filter(i => i !== null));
		},
	});

	router.route({
		method: 'POST',
		path: '/saves',
		options: {
			validate: {
				payload: {
					slot: Joi.number().min(1).max(8).required(),
					computerName: Joi.string().required(),
					computerId: Joi.string().required(),
					name: Joi.string().required(),
					version: Joi.string().required(),
					completed: Joi.number().required(),
					savedAt: Joi.date().required(),
					file: Joi.any().required(),
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
			const hash: string = await hashFile(request.payload.file.path);
			await S3.upload(getSavePath(request.auth.credentials.user.id, request.payload.slot, hash), createReadStream(request.payload.file.path));

			return {
				slot: request.payload.slot,
				current: transformSave(request.auth.credentials.user.id, await SaveGameState.create({
					...pick(request.payload, ['name', 'version', 'completed', 'savedAt', 'slot', 'computerName', 'computerId']),
					hash,
				})),
			};
		},
	});

	router.route({
		method: 'GET',
		path: '/saves/{slot}',
		options: {
			validate: {
				params: {
					slot: Joi.number().min(1).max(8).required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return SaveGameState.findAll({
				where: {
					slot: request.params.slot,
					userId: request.auth.credentials.user.id,
				},
				order: [['savedAt', 'DESC']],
				limit: 10,
			}).then((games: SaveGameState[]) => {
				return {
					slot: request.params.slot,
					current: games.length ? transformSave(request.auth.credentials.user.id, games[0]) : null,
					states: games.map(i => transformSave(request.auth.credentials.user.id, i)),
				};
			});
		},
	});
};
