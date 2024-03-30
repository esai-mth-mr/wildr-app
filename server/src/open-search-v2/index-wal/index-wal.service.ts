import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import {
  IndexVersionAlias,
  IndexVersionName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { Inject, Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntityIndexLog } from '@verdzie/server/open-search-v2/index-wal/user-entity/user-entity-index-log.entity.bi';
import { PostEntityIndexLog } from '@verdzie/server/open-search-v2/index-wal/post-entity/post-entity-index-log.entity.bi';
import {
  UserSnapshot,
  isUserSnapshot,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { PostSnapshot } from '@verdzie/server/open-search-v2/index-version/post-index-version.config';
import { InjectConnection } from '@nestjs/typeorm';
import { BI_CONNECTION_NAME } from '@verdzie/server/typeorm/typeormconfig-bi';

export type EntityIndexLogType = UserEntityIndexLog | PostEntityIndexLog;
export type SnapshotType = UserSnapshot | PostSnapshot;

export interface EntityIndexLog {
  snapshot: SnapshotType;
  indexVersion: IndexVersionName;
  indexAlias: IndexVersionAlias;
  createdAt: Date;
}

export function toLogId({
  entityId,
  createdAt,
  indexInBatch,
}: {
  entityId: string;
  createdAt: Date;
  indexInBatch: number;
}): string {
  return (
    entityId + ID_SEPARATOR + createdAt.getTime() + ID_SEPARATOR + indexInBatch
  );
}

export interface EntityIndexUpdateLogItem {
  indexVersion: IndexVersionName;
  indexAlias: IndexVersionAlias;
  entitySnapshot: SnapshotType;
}

@Injectable()
export class OSIndexWALService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection(BI_CONNECTION_NAME)
    private readonly connection: Connection
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async logEntityIndexUpdates(updates: EntityIndexUpdateLogItem[]) {
    const context = {
      count: updates.length,
      methodName: 'logEntityIndexUpdate',
    };
    this.logger.info('logging entity index updates', context);
    if (!updates.length) return;
    const logs = updates.map(
      ({ entitySnapshot, indexVersion, indexAlias }, indexInBatch) => {
        if (isUserSnapshot(entitySnapshot)) {
          return new UserEntityIndexLog(
            entitySnapshot.id,
            entitySnapshot,
            indexVersion,
            indexAlias,
            indexInBatch
          );
        } else {
          return new PostEntityIndexLog(
            entitySnapshot.id,
            entitySnapshot,
            indexVersion,
            indexAlias,
            indexInBatch
          );
        }
      }
    );
    const repo = this.connection.getRepository(logs[0]?.constructor);
    await repo.insert(logs);
    this.logger.info('logged entity index updates', context);
  }
}
