import { EntitySchema } from 'typeorm';
import { PostEntityIndexState } from './post-entity-index-state.entity.bi';

export const PostEntityIndexStateSchema =
  new EntitySchema<PostEntityIndexState>({
    name: 'PostEntityIndexState',
    target: PostEntityIndexState,
    columns: {
      id: {
        name: 'id',
        type: 'varchar',
        primary: true,
      },
      snapshot: {
        name: 'snapshot',
        type: 'jsonb',
        nullable: true,
      },
      incrementalIndexState: {
        name: 'incremental_index_state',
        type: 'varchar',
        nullable: true,
      },
      incrementalIndexRequests: {
        name: 'incremental_index_requests',
        type: 'jsonb',
        nullable: true,
      },
      reIndexState: {
        name: 're_index_state',
        type: 'varchar',
        nullable: true,
      },
      reIndexRequests: {
        name: 're_index_requests',
        type: 'jsonb',
        nullable: true,
      },
      createdAt: {
        name: 'created_at',
        type: 'timestamp with time zone',
        createDate: true,
      },
      updatedAt: {
        name: 'updated_at',
        type: 'timestamp with time zone',
        updateDate: true,
      },
    },
  });
