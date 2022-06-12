import { Storage } from '@google-cloud/storage';
import vaultConfig from '@majesticfudgie/vault-config';
import { Stream } from 'stream';

const storage = vaultConfig.has('storage.auth') ? new Storage({
	projectId: vaultConfig.get('storage.auth.project_id'),
	credentials: vaultConfig.get('storage.auth'),
}) : new Storage();

class S3CDN {
	public async getUrl(key: string): Promise<string> {
		const [url] = await storage.bucket(vaultConfig.get('storage.bucket')).file(key).getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + 10 * 60 * 1000,
		});

		return url;
	}

	public async upload(key: string, data: Buffer, kind?: string): Promise<void> {
		await storage.bucket(vaultConfig.get('storage.bucket')).file(key).save(data, {
			contentType: kind,
		});
	}

	public async uploadStream(key: string, data: Stream, kind?: string): Promise<void> {
		const stream = storage.bucket(vaultConfig.get('storage.bucket')).file(key).createWriteStream({
			contentType: kind,
		});

		data.pipe(stream);

		return new Promise((resolve) => {
			data.once('end', resolve);
		});
	}
}

export const S3 = new S3CDN();
