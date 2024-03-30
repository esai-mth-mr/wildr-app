import { EntitySchema } from 'typeorm';
import { PostEntityIndexLog } from './post-entity-index-log.entity.bi';

export const PostEntityIndexLogSchema = new EntitySchema<PostEntityIndexLog>({
  name: 'PostEntityIndexLog',
  target: PostEntityIndexLog,
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
