import { BelongsTo, Column, DataType, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User.js';

@Table
export class PersonalServer extends Model<PersonalServer> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false, type: DataType.STRING })
	declare public id: string;

	@Column(DataType.STRING)
	declare public hash: string;

	@Column(DataType.STRING)
	declare public address: string;

	@Column(DataType.NUMBER)
	declare public port: number;

	@Column(DataType.NUMBER)
	declare public order: number;

	@Column({ type: DataType.STRING, allowNull: true })
	declare public serverPassword: string | null;

	@Column({ type: DataType.STRING, allowNull: true })
	declare public sampUsername: string | null;

	@Column({ type: DataType.STRING, allowNull: true })
	declare public rconPassword: string | null;

	@BelongsTo((): typeof User => User)
	declare public user: User;

	@ForeignKey((): typeof User => User)
	declare public userId: string;
}
