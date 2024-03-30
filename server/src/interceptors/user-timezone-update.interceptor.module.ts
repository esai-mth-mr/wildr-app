import { Module } from '@nestjs/common';
import { UserTimezoneUpdateInterceptor } from '@verdzie/server/interceptors/user-timezone-update.interceptor';
import { UserTimezoneUpdateProducerModule } from '@verdzie/server/worker/user-timezone-update/user-timezone-update-producer.module';

@Module({
  imports: [UserTimezoneUpdateProducerModule],
  providers: [UserTimezoneUpdateInterceptor],
  exports: [UserTimezoneUpdateInterceptor],
})
export class UserTimezoneUpdateInterceptorModule {}
