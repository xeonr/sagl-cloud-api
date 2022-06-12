module.exports = {
	"discord": {
		"clientId": "vault:sagl/cloud-api.discord.clientId",
		"clientSecret": "vault:sagl/cloud-api.discord.clientSecret",
		"redirectUri": "https://cloud-api.sagl.app/v1/auth",
		"scopes": [
			"identify",
			"email",
			"guilds"
		]
	},
	"database": {
		"database": "vault:sagl/database/mysql.databases.cloudApi",
		"dialect": "mysql",
		"username": "vault:sagl/database/mysql.username",
		"password": "vault:sagl/database/mysql.password",
		"host": "vault:sagl/database/mysql.host",
	},
	"redis": {
		"host": "vault:sagl/database/redis.host",
		"keyPrefix": "sagl:",
		"port": "vault:sagl/database/redis.port",
		"password": "vault:sagl/database/redis.password",
	},
	"storage": {
		"bucket": "cdn.sagl.app",
		"auth": "vault:sagl/cloud-api.gcs",
	},
	"web": {
		"auth": "vault:sagl/cloud-api.jwtSecret",
		"host": "0.0.0.0",
		"port": 8080,
	},
	"saglServerApi": "https://server-api.sagl.app"
}
