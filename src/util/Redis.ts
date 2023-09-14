import vaultConfig from 'config';
import IORedis, { Redis } from 'ioredis';

function getRedis(): Redis {
	return new IORedis(vaultConfig.get('redis'));
}

const client: { pub: Redis } = {
	pub: getRedis(),
};

export const redisPub: Redis = client.pub;
