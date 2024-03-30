import { Module } from '@nestjs/common';

import { MailGunModule } from '@verdzie/server/mail-gun/mail-gun.module';
import { AdminMailGunController } from '@verdzie/server/admin/mail-gun/adminMailGun.controller';
import { AdminMailGunService } from '@verdzie/server/admin/mail-gun/adminMailGun.service';
import { UserModule } from '@verdzie/server/user/user.module';
import { ReviewReportRequestModule } from '@verdzie/server/review-report-request/reviewReportRequest.module';

@Module({
  imports: [MailGunModule, UserModule, ReviewReportRequestModule],
  controllers: [AdminMailGunController],
  providers: [AdminMailGunService],
  exports: [AdminMailGunService],
})
export class AdminMailGunModule {}
