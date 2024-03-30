import { EntitySchema } from 'typeorm';
import { UserEntityIndexLog } from './user-entity-index-log.entity.bi';

export const UserEntityIndexLogSchema = new EntitySchema<UserEntityIndexLog>({
  name: 'UserEntityIndexLog',
  target: UserEntityIndexLog,
  columns: {
    id: {
      name: 'id',
      type: 'varchar',
      primary: true,
    },
    snapshot: {
      name: 'snapshot',
      type: 'jsonb',
    },
    indexVersion: {
      name: 'index_version',
      type: 'varchar',
    },
    indexAlias: {
      name: 'index_alias',
      type: 'varchar',
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp with time zone',
      createDate: true,
    },
  },
});
