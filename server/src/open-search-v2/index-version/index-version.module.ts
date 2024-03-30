import { Module } from '@nestjs/common';
import { IndexVersionService } from './index-version.service';
import { IndexVersionConfiguration } from './index-version.config';

@Module({
  providers: [IndexVersionService, IndexVersionConfiguration],
  exports: [IndexVersionService],
})
export class IndexVersionModule {}
