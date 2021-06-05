import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, NotNull, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User';

@Table
export class GameConfig extends Model<GameConfig> {
	@IsUUID(4)
	@NotNull
	@PrimaryKey
	@Column
	public id: string;

	@Column
	public name: string;

	@Column(DataType.JSON)
	public value: string;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
