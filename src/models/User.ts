import { Column, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

@Table
export class User extends Model<User> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@Column
	public discordUsername: string;

	@Column
	public discordDiscriminator: string;

	@Column
	public discordId: string;

	@Column
	public email: string;
}
