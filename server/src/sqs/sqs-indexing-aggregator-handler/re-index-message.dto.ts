import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { IsEnum } from 'class-validator';

export class IndexMessageDto {
  @IsEnum(['UserEntity', 'PostEntity'], {
    message: 'entityName must be one of UserEntity, PostEntity',
  })
  entityName: IndexableEntityName;

  @IsEnum(IndexingJobType)
  jobType: IndexingJobType;

  constructor(body?: any) {
    if (body) {
      this.entityName = JSON.parse(body).entityName;
      this.jobType = JSON.parse(body).jobType;
    }
  }
}
