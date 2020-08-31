import { BelongsTo, Column, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { User } from './User';

@Table
export class SaveGameState extends Model<SaveGameState> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@Column
	public hash: string;

	@Column
	public name: string;

	@Column
	public version: string;

	@Column
	public completed: number;

	@Column
	public slot: number;

	@Column
	public savedAt: Date;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
