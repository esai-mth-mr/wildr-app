import {
  IndexVersionAlias,
  IndexVersionName,
} from '../../index-version/index-version.service';
import { UserSnapshot } from '../../index-version/user-index-version.config';
import { EntityIndexLog, toLogId } from '../index-wal.service';

export class UserEntityIndexLog implements EntityIndexLog {
  id: string;
  snapshot: UserSnapshot;
  indexVersion: IndexVersionName;
  indexAlias: IndexVersionAlias;
  createdAt: Date;

  constructor(
    entityId: string,
    snapshot: UserSnapshot,
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
