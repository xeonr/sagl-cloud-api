import { BelongsTo, Column, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { User } from './User';

@Table
export class PersonalServer extends Model<PersonalServer> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@Column
	public hash: string;

	@Column
	public address: string;

	@Column
	public serverPassword: string | null;

	@Column
	public rconPassword: string | null;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
