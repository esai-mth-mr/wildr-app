import { Module } from '@nestjs/common';
import { TrollDetectorService } from './troll-detector.service';

@Module({
  providers: [TrollDetectorService],
  exports: [TrollDetectorService],
})
export class TrollDetectorModule {}
