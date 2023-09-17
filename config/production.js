module.exports = {
	discord: {
		clientId: process.env.SAGL_DISCORD_CLIENT_ID,
		clientSecret: process.env.SAGL_DISCORD_CLIENT_SECRET,
		redirectUri: "https://cloud-api.sagl.app/v1/auth",
		scopes: ["identify", "email", "guilds"],
	},
	database: {
		database: process.env.SAGL_MYSQL_DATABASE,
		dialect: "mysql",
		username: process.env.SAGL_MYSQL_USERNAME,
		password: process.env.SAGL_MYSQL_PASSWORD,
		host: process.env.SAGL_MYSQL_HOST,
	},
	redis: {
		host: process.env.SAGL_REDIS_HOST,
		keyPrefix: "sagl:",
		port: process.env.SAGL_REDIS_PORT,
		password: process.env.SAGL_REDIS_PASSWORD,
	},
	storage: {
		bucket: "cdn.sagl.app",
		auth: (() => {
			const gcs = JSON.parse(
				process.env.SAGL_STORAGE_JSON,
			);

			gcs['private_key'] = gcs['private_key'].replace(/\\n/g, '\n');

			return gcs;
		})(),
	},
	web: {
		jwtToken: process.env.SAGL_JWT_SECRET,
		host: "0.0.0.0",
		port: 8080,
	},
	saglServerApi: "https://server-api.sagl.app",
};
