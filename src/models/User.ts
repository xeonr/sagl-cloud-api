import { Column, DataType, Default, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ type: DataType.STRING, allowNull: false })
	declare public id: string;

	@Column(DataType.STRING)
	declare public discordAvatar: string;

	@Column(DataType.STRING)
	declare public discordUsername: string;

	@Column(DataType.STRING)
	declare public discordDiscriminator: string;

	@Column(DataType.STRING)
	declare public discordId: string;

	@Column(DataType.STRING)
	declare public discordAccessToken: string;

	@Column(DataType.STRING)
	declare public discordRefreshToken: string;

	@Column(DataType.DATE)
	declare public discordAccessExpiry: Date;

	@Column(DataType.STRING)
	declare public email: string;

	@Column(DataType.STRING)
	declare public sampUsername: string;

	@Default({})
	@Column(DataType.JSON)
	declare public launcherSettings: object;

	@Default(false)
	@Column(DataType.BOOLEAN)
	declare public whitelisted: boolean;


	@Default(false)
	@Column(DataType.BOOLEAN)
	declare public admin: boolean;
}
