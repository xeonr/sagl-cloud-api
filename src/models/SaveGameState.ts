import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User.js';

@Table
export class SaveGameState extends Model<SaveGameState> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false, type: DataType.STRING })
	declare public id: string;

	@Column(DataType.STRING)
	declare public hash: string;

	@Column(DataType.STRING)
	declare public name: string;

	@Column(DataType.STRING)
	declare public version: string;

	@Column(DataType.NUMBER)
	declare public completed: number;

	@Column(DataType.NUMBER)
	declare public slot: number;

	@Column(DataType.BOOLEAN)
	declare public active: boolean;

	@Column(DataType.DATE)
	declare public savedAt: Date;

	@BelongsTo((): typeof User => User)
	declare public user: User;

	@ForeignKey((): typeof User => User)
	declare public userId: string;
}
