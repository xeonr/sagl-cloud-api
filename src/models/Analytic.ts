import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { User } from './User';

@Table
export class Analytic extends Model<Analytic> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@Column
	public name: string;

	@Column(DataType.JSON)
	public payload: object;

	@Column(DataType.STRING)
	public timezone: string;

	@Column(DataType.STRING)
	public osPlatform: string;

	@Column(DataType.STRING)
	public osRelease: string;

	@Column(DataType.STRING)
	public osVersion: string;

	@Column(DataType.STRING)
	public appVersion: string;

	@Column(DataType.STRING)
	public sampVersion: string;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
