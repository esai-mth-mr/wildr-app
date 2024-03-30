import { EntitySchema } from 'typeorm';
import { UserEntityIndexState } from '@verdzie/server/open-search-v2/index-state/user-entity/user-entity-index-state.entity.bi';

export const UserEntityIndexStateSchema =
  new EntitySchema<UserEntityIndexState>({
    name: 'UserEntityIndexState',
    target: UserEntityIndexState,
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
