module.exports = {
	"discord": {
		"clientId": process.env.DISCORD_CLIENT_ID,
		"clientSecret": process.env.DISCORD_CLIENT_SECRET,
		"redirectUri": "https://cloud-api.sagl.app/v1/auth",
		"scopes": [
			"identify",
			"email"
		]
	},
	"database": {
		"database": process.env.MYSQL_DB_DB,
		"dialect": "mysql",
		"username": process.env.MYSQL_DB_USER,
		"password": process.env.MYSQL_DB_PASS,
		dialectOptions: {
			socketPath: '/cloudsql/'+process.env.MYSQL_CONN
		},
	},
	"redis": {
		"host": process.env.REDIS_HOST,
		"keyPrefix": "sagl:",
		"port": process.env.REDIS_PORT,
		"password": process.env.REDIS_PASS
	},
	"storage": {
		"bucket": "cdn.sagl.app",
		"auth": undefined
	},
	"web": {
		"jwtToken": process.env.JWT_SECRET,
		"host": "0.0.0.0",
		"port": process.env.PORT,
	}
}
