import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { User } from './User';

@Table
export class GameConfig extends Model<GameConfig> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@Column
	public name: string;

	@Column(DataType.JSON)
	public value: string;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
