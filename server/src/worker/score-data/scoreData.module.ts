import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ScoreDataProducer } from './scoreData.producer';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'score-data-queue',
    }),
  ],
  providers: [ScoreDataProducer],
  exports: [ScoreDataProducer],
})
export class ScoreDataWorkerModule {}
