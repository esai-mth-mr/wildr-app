import { Module } from '@nestjs/common';
import { GoogleApiService } from '@verdzie/server/google-api/google-api.service';

@Module({
  imports: [],
  providers: [GoogleApiService],
  exports: [GoogleApiService],
})
export class GoogleApiModule {}
