import { BelongsTo, Column, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User';

@Table
export class PersonalServer extends Model<PersonalServer> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false })
	public id: string;

	@Column
	public hash: string;

	@Column
	public address: string;

	@Column
	public port: number;

	@Column
	public description: string;

	@Column
	public order: number;

	@Column
	public serverPassword: string | null;

	@Column
	public sampUsername: string | null;

	@Column
	public rconPassword: string | null;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
