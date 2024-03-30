import { EntitySchema } from 'typeorm';
import { UserPropertyMapEntity } from './userPropertyMap.entity';

export const UserPropertyMapSchema = new EntitySchema<UserPropertyMapEntity>({
  name: 'UserPropertyMapEntity',
  target: UserPropertyMapEntity,
  columns: {
    id: {
      name: 'id',
      type: 'varchar',
      primary: true,
      unique: true,
    },
    userPropertyKvP: {
      name: 'user_property_map',
      type: 'jsonb',
      array: false,
      nullable: true,
    },
  },
});
