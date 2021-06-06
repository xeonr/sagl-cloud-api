import { BelongsTo, Column, ForeignKey, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { User } from './User';

@Table
export class GalleryImage extends Model<GalleryImage> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ allowNull: false })
	public id: string;

	@Column
	public uploadedAt: string;

	@Column
	public source: string;

	@Column
	public fileHash: string;

	@BelongsTo((): typeof User => User)
	public user: User;

	@ForeignKey((): typeof User => User)
	public userId: string;
}
