import { notFound } from '@hapi/boom';
import { Lifecycle, ResponseToolkit, Server } from '@hapi/hapi';
import { createReadStream } from 'fs';
import Joi from 'joi';
import { omit } from 'lodash';
import { v4 } from 'uuid';

import { GalleryImage } from '../../models/GalleryImage';
import { Request } from '../../util/Auth';
import { S3 } from '../../util/S3';
import { RouterFn } from './../../util/Types';

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
				order: [['uploadedAt', 'desc']],
			}).then((images: GalleryImage[]) => {
				return images.map((image: GalleryImage) => omit({
					...image.toJSON(),
					cdnUrl: S3.getUrl(getGalleryPath(request.auth.credentials.user.id, image.id, 'jpg')),
				}, ['userId', 'updatedAt']));
			});
		},
	});

	router.route({
		method: 'POST',
		path: '/gallery',
		options: {
			validate: {
				payload: {
					source: Joi.string().required(),
					file: Joi.any().required(),
					uploadedAt: Joi.date().required(),
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
			const id = v4();
			await S3.upload(getGalleryPath(request.auth.credentials.user.id, id, 'jpg'), createReadStream(request.payload.file.path), 'image/jpeg');

			return omit((await GalleryImage.create({
				id,
				source: request.payload.source,
				uploadedAt: request.payload.uploadedAt.toISOString(),
				userId: request.auth.credentials.user.id,
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
