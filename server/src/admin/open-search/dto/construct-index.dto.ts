import {
  IndexVersionAlias,
  IndexVersionName,
  IndexableEntityName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { IsEnum, IsString, Matches } from 'class-validator';

export class ConstructIndexDto {
  @IsEnum(['UserEntity', 'PostEntity'])
  entityName: IndexableEntityName;

  @IsString()
  @Matches(/^[a-z_1-9]+$/, {
    message:
      'indexVersion name can only contain lowercase letters and underscores',
  })
  indexVersionName: IndexVersionName;

  @IsString()
  @Matches(/^[a-z_1-9]+$/, {
    message:
      'indexVersionAlias can only contain lowercase letters and underscores',
  })
  indexVersionAlias: IndexVersionAlias;
}
