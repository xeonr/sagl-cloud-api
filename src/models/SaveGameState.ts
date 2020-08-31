import { BelongsTo, Column, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { SaveGame } from './SaveGame';

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
	public savedAt: Date;

	@BelongsTo((): typeof SaveGame => SaveGame)
	public saveGame: SaveGame;

	@ForeignKey((): typeof SaveGame => SaveGame)
	public saveGameId: string;
}
