import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User.js';

@Table
export class Analytic extends Model<Analytic> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false, type: DataType.STRING })
	declare public id: string;

	@Column(DataType.STRING)
	declare public name: string;

	@Column(DataType.JSON)
	declare public payload: object;

	@Column(DataType.STRING)
	declare public timezone: string;

	@Column(DataType.STRING)
	declare public osPlatform: string;

	@Column(DataType.STRING)
	declare public osRelease: string;

	@Column(DataType.STRING)
	declare public machineId: string;

	@Column(DataType.JSON)
	declare public metrics: object;

	@Column(DataType.STRING)
	declare public osVersion: string;

	@Column(DataType.STRING)
	declare public appVersion: string;

	@Column(DataType.STRING)
	declare public sampVersion: string;

	@Column(DataType.STRING)
	declare public ipAddress: string;

	@BelongsTo((): typeof User => User)
	declare public user: User;

	@ForeignKey((): typeof User => User)
	declare public userId: string;
}
