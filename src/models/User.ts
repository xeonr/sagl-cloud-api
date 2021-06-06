import { Column, DataType, Default, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false })
	public id: string;

	@Column
	public discordAvatar: string;

	@Column
	public discordUsername: string;

	@Column
	public discordDiscriminator: string;

	@Column
	public discordId: string;

	@Column
	public discordAccessToken: string;

	@Column
	public discordRefreshToken: string;

	@Column(DataType.DATE)
	public discordAccessExpiry: Date;

	@Column
	public email: string;

	@Column
	public sampUsername: string;

	@Default({})
	@Column(DataType.JSON)
	public launcherSettings: object;
}
