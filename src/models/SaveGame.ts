import { BelongsTo, Column, ForeignKey, HasMany, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { SaveGameState } from './SaveGameState';
import { User } from './User';

@Table
export class SaveGame extends Model<SaveGame> {
	@IsUUID(4)
	@PrimaryKey
	@Column
	public id: string = v4();

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;

	@HasMany((): typeof SaveGameState => SaveGameState)
	public states: SaveGameState[];
}
