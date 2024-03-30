import { ChallengeCoverService } from '@verdzie/server/challenge/challengeCover.service';
import { UploadModule } from '@verdzie/server/upload/upload.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [UploadModule],
  exports: [ChallengeCoverService],
  providers: [ChallengeCoverService],
})
export class ChallengeCoverModule {}
