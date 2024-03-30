import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TagModule } from '../tag/tag.module';
import { ContentService } from './content.service';
@Module({
  imports: [UserModule, TagModule],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
