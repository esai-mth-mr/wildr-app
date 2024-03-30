import { EntitySchema } from 'typeorm';
import { UserListEntity } from './userList.entity';

export const UserListSchema = new EntitySchema<UserListEntity>({
  name: 'UserListEntity',
  target: UserListEntity,
  columns: {
    id: {
      name: 'id',
      type: 'varchar',
      unique: true,
      primary: true,
    },
    name: {
      name: 'name',
      type: 'varchar',
      nullable: false,
    },
    ids: {
      name: 'members',
      type: 'jsonb',
      array: false,
      nullable: false,
    },
    iconUrl: {
      name: 'icon_url',
      type: 'varchar',
      nullable: true,
    },
    metaData: {
      name: 'meta_data',
      type: 'jsonb',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      nullable: true,
      createDate: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamp',
      nullable: true,
      updateDate: true,
    },
  },
});
