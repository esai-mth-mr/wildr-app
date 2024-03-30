import { Module } from '@nestjs/common';
import { ContextService } from '@verdzie/server/context/context.service';

@Module({
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
