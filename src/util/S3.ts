import { Storage } from '@google-cloud/storage';
import { Stream } from 'stream';
import { get, has } from 'config';

const storage = has('storage.auth') ? new Storage({
	projectId: get('storage.auth.project_id'),
	credentials: get('storage.auth'),
}) : new Storage();

class S3CDN {
	public async getUrl(key: string): Promise<string> {
		const [url] = await storage.bucket(get('storage.bucket')).file(key).getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + 10 * 60 * 1000,
		});

		return url;
	}

	public async upload(key: string, data: Buffer, kind?: string): Promise<void> {
		await storage.bucket(get('storage.bucket')).file(key).save(data, {
			contentType: kind,
		});
	}

	public async uploadStream(key: string, data: Stream, kind?: string): Promise<void> {
		const stream = storage.bucket(get('storage.bucket')).file(key).createWriteStream({
			contentType: kind,
		});

		data.pipe(stream);

		return new Promise((resolve) => {
			data.once('end', resolve);
		});
	}
}

export const S3 = new S3CDN();
