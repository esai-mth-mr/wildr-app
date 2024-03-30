import { Injectable } from '@nestjs/common';
import { postIndexVersionConfig } from './post-index-version.config';
import { userIndexVersionConfig } from './user-index-version.config';
import { IndexVersionConfig, IndexableEntity } from './index-version.service';
import { ObjectType } from 'typeorm';

@Injectable()
export class IndexVersionConfiguration {
  public readonly indexVersionConfigs: Map<
    ObjectType<IndexableEntity>,
    IndexVersionConfig<any, any>
  >;

  constructor() {
    this.indexVersionConfigs = new Map();
    this.indexVersionConfigs.set(
      userIndexVersionConfig.entityType,
      userIndexVersionConfig
    );
    this.indexVersionConfigs.set(
      postIndexVersionConfig.entityType,
      postIndexVersionConfig
    );
  }
}
