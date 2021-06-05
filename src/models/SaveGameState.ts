import { BelongsTo, Column, ForeignKey, IsUUID, Model, NotNull, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User';

@Table
export class SaveGameState extends Model<SaveGameState> {
	@IsUUID(4)
	@NotNull
	@PrimaryKey
	@Column
	public id: string;

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
