import { PostEntity } from '../post/post.entity';
import { UserEntity } from '../user/user.entity';
import {
  IndexableEntity,
  IndexableEntityName,
} from './index-version/index-version.service';
import { ObjectType } from 'typeorm';
import { UserEntityIndexState } from './index-state/user-entity/user-entity-index-state.entity.bi';
import { PostEntityIndexState } from './index-state/post-entity/post-entity-index-state.entity.bi';
import {
  EntityIndexState,
  EntityIndexStateTypes,
} from './index-state/index-state.service';
import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';

export function getEntityConstructorFromName(
  entityName: IndexableEntityName
): ObjectType<IndexableEntity> {
  switch (entityName) {
    case 'UserEntity':
      return UserEntity;
    case 'PostEntity':
      return PostEntity;
  }
}

export function getEntityIndexStateConstructorFromName(
  entityName: IndexableEntityName
): ObjectType<EntityIndexStateTypes> {
  switch (entityName) {
    case 'UserEntity':
      return UserEntityIndexState;
    case 'PostEntity':
      return PostEntityIndexState;
  }
}

export function getStateKeyFromJobType(
  indexingJobType: IndexingJobType
): keyof Pick<EntityIndexState, 'incrementalIndexState' | 'reIndexState'> {
  switch (indexingJobType) {
    case IndexingJobType.INCREMENTAL_INDEX:
      return 'incrementalIndexState';
    case IndexingJobType.RE_INDEX:
      return 'reIndexState';
    default:
      const _exhaustiveCheck: never = indexingJobType;
      return _exhaustiveCheck;
  }
}

export function getRequestsKeyFromJobType(
  indexingJobType: IndexingJobType
): keyof Pick<
  EntityIndexState,
  'incrementalIndexRequests' | 'reIndexRequests'
> {
  switch (indexingJobType) {
    case IndexingJobType.INCREMENTAL_INDEX:
      return 'incrementalIndexRequests';
    case IndexingJobType.RE_INDEX:
      return 'reIndexRequests';
    default:
      const _exhaustiveCheck: never = indexingJobType;
      return _exhaustiveCheck;
  }
}
