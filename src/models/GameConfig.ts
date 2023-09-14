import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User.js';

@Table
export class GameConfig extends Model<GameConfig> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false, type: DataType.STRING })
	declare public id: string;

	@Column(DataType.STRING)
	declare public name: string;

	@Column(DataType.JSON)
	declare public value: string;

	@BelongsTo((): typeof User => User)
	declare public user: User;

	@ForeignKey((): typeof User => User)
	declare public userId: string;
}
