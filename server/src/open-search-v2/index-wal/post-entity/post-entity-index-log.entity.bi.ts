import {
  IndexVersionAlias,
  IndexVersionName,
} from '../../index-version/index-version.service';
import {
  EntityIndexLog,
  toLogId,
} from '@verdzie/server/open-search-v2/index-wal/index-wal.service';
import { PostSnapshot } from '@verdzie/server/open-search-v2/index-version/post-index-version.config';

export class PostEntityIndexLog implements EntityIndexLog {
  id: string;
  snapshot: PostSnapshot;
  indexVersion: IndexVersionName;
  indexAlias: IndexVersionAlias;
  createdAt: Date;

  constructor(
    entityId: string,
    snapshot: PostSnapshot,
    indexVersion: IndexVersionName,
    indexAlias: IndexVersionAlias,
    indexInBatch: number
  ) {
    const createdAt = new Date();
    this.id = toLogId({ entityId, createdAt, indexInBatch });
    this.snapshot = snapshot;
    this.indexVersion = indexVersion;
    this.indexAlias = indexAlias;
    this.createdAt = createdAt;
  }
}
