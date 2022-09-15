import { notFound } from '@hapi/boom';
import { Lifecycle, Server } from '@hapi/hapi';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import Joi from 'joi';
import { omit, pick } from 'lodash';
import { v4 } from 'uuid';

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

async function transformSave(userId: string, save: SaveGameState) {
	return {
		...omit(save.toJSON(), ['saveGameId', 'updatedAt', 'slot']),
		cdnUrl: await S3.getUrl(getSavePath(userId, save.slot, save.hash)),
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
					active: true,
				},
				limit: 1,
			}).then(async ([game]: SaveGameState[]) => {
				if (!game) {
					return {
						slot: slot,
						currentId: null,
						current: null,
					};
				}

				return {
					slot: game.slot,
					currentId: game.id,
					current: await transformSave(request.auth.credentials.user.id, game),
				};
			}))).then(r => r.filter(i => i !== null));
		},
	});

	router.route({
		method: 'POST',
		path: '/saves/{slot}/upload',
		options: {
			validate: {
				payload: {
					computerName: Joi.string().required(),
					computerId: Joi.string().required(),
					name: Joi.string().required(),
					version: Joi.string().required(),
					completed: Joi.number().required(),
					savedAt: Joi.date().required(),
					file: Joi.any().required(),
					markActive: Joi.boolean().default(false),
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

			await S3.uploadStream(
				getSavePath(request.auth.credentials.user.id, request.payload.slot, hash), createReadStream(request.payload.file.path),
			);

			if (request.payload.markActive) {
				await SaveGameState.update({ active: false }, { where: {
					slot: request.params.slot,
					userId: request.auth.credentials.user.id,
				}});
			}

			const state = await SaveGameState.create({
				id: v4(),
				...pick(request.payload, ['name', 'version', 'completed', 'savedAt', 'computerName', 'computerId']),
				slot: request.params.slot,
				hash,
				active: request.payload.markActive,
				userId: request.auth.credentials.user.id,
			});

			return transformSave(request.auth.credentials.user.id, state);
		},
	});

	async function getFullSlot(userId: string, slot: number) {
		const active = await SaveGameState.findOne({ where: {
			active: true,
			slot,
			userId,
		}})

		return SaveGameState.findAll({
			where: {
				slot,
				userId: userId,
			},
			order: [['createdAt', 'DESC']],
			limit: 30,
		}).then(async (games: SaveGameState[]) => {
			// Add the active save to the end if it's out of our history.
			if (active && !games.find(i => i.id === active.id)) {
				games.push(active);
			}

			return {
				slot,
				currentId: active ? active.id : null,
				current: active ? await transformSave(userId, active) : null,
				history: await Promise.all(games.map(i => transformSave(userId, i))),
			};
		});
	}
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
			return getFullSlot(request.auth.credentials.user.id, request.params.slot);
		},
	});

	router.route({
		method: 'PATCH',
		path: '/saves/{slot}',
		options: {
			validate: {
				params: {
					slot: Joi.number().min(1).max(8).required(),
				},
				payload: {
					currentId: Joi.string().allow(null).required(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			let save = null;

			if (request.payload.currentId) {
				save = await SaveGameState.findOne({
					where: {
						id: request.payload.currentId,
						userId: request.auth.credentials.user.id,
						slot: request.params.slot,
					}
				});

				if (!save) {
					throw notFound('Save was not found in this slot history');
				}
			}

			await SaveGameState.update({ active: false }, { where: { slot: request.params.slot, userId: request.auth.credentials.user.id } });

			if (save) {
				await save.update({ active: true });
			}

			return getFullSlot(request.auth.credentials.user.id, request.params.slot);
		},
	});
};
