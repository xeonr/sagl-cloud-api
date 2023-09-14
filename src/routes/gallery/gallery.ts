import { badData, badRequest, notFound } from '@hapi/boom';
import { Lifecycle, ResponseToolkit, Server } from '@hapi/hapi';
import { createHash } from 'crypto';
import { createReadStream, readFileSync } from 'fs';
import Joi from 'joi';
import { omit } from 'lodash-es';
import { v4 } from 'uuid';

import { GalleryImage } from '../../models/GalleryImage.js';
import { Request } from '../../util/Auth.js';
import { S3 } from '../../util/S3.js';
import { RouterFn } from './../../util/Types.js';

function getGalleryPath(userId: string, id: string, extension: string): string {
	return `gallery/${userId}/${id}.${extension}`;
}

export const routes: RouterFn = (router: Server): void => {
	router.route({
		method: 'GET',
		path: '/gallery',
		options: {
			validate: {
				query: {
					source: Joi.string().optional(),
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			return GalleryImage.findAll({
				where: {
					...request.query,
					userId: request.auth.credentials.user.id,
				},
				order: [['originalCreatedAt', 'desc']],
			}).then((images: GalleryImage[]) => {
				return Promise.all(images.map(async (image: GalleryImage) => omit({
					...image.toJSON(),
					cdnUrl: await S3.getUrl(getGalleryPath(request.auth.credentials.user.id, image.id, 'jpg')),
				}, ['userId', 'updatedAt'])));
			});
		},
	});

	router.route({
		method: 'POST',
		path: '/gallery',
		options: {
			validate: {
				payload: {
					name: Joi.string().required(),
					source: Joi.string().required(),
					file: Joi.any().required(),
					fileHash: Joi.string().required(),
					originalCreatedAt: Joi.date().required(),
				},
			},
			payload: {
				maxBytes: 10 * 1000 * 1000,
				output: 'stream',
				parse: true,
				multipart: {
					output: 'file',
				},
			},
		},
		handler: async (request: Request): Promise<Lifecycle.ReturnValue> => {
			const fileHash = createHash('sha256').update(readFileSync(request.payload.file.path)).digest('hex');

			if (fileHash !== request.payload.fileHash) {
				throw badData('The image uploaded does not match the provided file hash');
			}

			const id = v4();

			if ((await GalleryImage.count({ where: { userId: request.auth.credentials.user.id, fileHash } })) >= 1) {
				throw badRequest('This image has already been uploaded to the users gallery');
			}

			await S3.uploadStream(getGalleryPath(request.auth.credentials.user.id, id, 'jpg'), createReadStream(request.payload.file.path), 'image/jpeg');

			return omit((await GalleryImage.create({
				id,
				name: request.payload.name,
				source: request.payload.source,
				originalCreatedAt: request.payload.originalCreatedAt.toISOString(),
				userId: request.auth.credentials.user.id,
				fileHash,
			})).toJSON(), ['userid']);
		},
	});

	router.route({
		method: 'DELETE',
		path: '/gallery/{id}',
		options: {
			validate: {
				params: {
					id: Joi.string().uuid({ version: 'uuidv4' }).required(),
				},
			},
		},
		handler: async (request: Request, h: ResponseToolkit): Promise<Lifecycle.ReturnValue> => {
			return GalleryImage.destroy({
				where: {
					id: request.params.saveId,
					userId: request.auth.credentials.user.id,
				},
			}).then((count: number) => {
				if (count === 0) {
					throw notFound('save not found');
				}

				return h.response().code(204);
			});
		},
	});
};
