import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { MailGunService } from '@verdzie/server/mail-gun/mail-gun.service';
import { PassFailState } from '@verdzie/server/data/common';
import { UserService } from '@verdzie/server/user/user.service';
import { ReviewReportRequestService } from '@verdzie/server/review-report-request/reviewReportRequest.service';

@Injectable()
export class AdminMailGunService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private mailGunService: MailGunService,
    private userService: UserService,
    private reviewReportService: ReviewReportRequestService
  ) {
    this.logger = this.logger.child({ context: 'AdminMailGunService' });
  }

  async report(
    uid: string,
    reason: string,
    link: string,
    sectionNumber: number,
    section: string,
    reportId: string
  ): Promise<boolean> {
    try {
      const user = await this.userService.findById(uid);
      const report = await this.reviewReportService.findById(reportId);
      if (!user) return false;
      if (!user.email) return false;
      await this.mailGunService.sendReportEmail(
        user.email,
        user.handle,
        reason,
        link,
        sectionNumber,
        section,
        report?.readableNumericId.toString() ?? reportId
      );
      return true;
    } catch (error) {
      this.logger.error('report', { error });
      return false;
    }
  }

  async realId(
    passFail: PassFailState,
    uid: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const user = await this.userService.findById(uid);
      if (!user) return false;
      if (!user.email) return false;
      switch (passFail) {
        case PassFailState.PASS:
          await this.mailGunService.sendRealIdPassedEmail(
            user.email,
            user.handle
          );
          return true;
        case PassFailState.FAIL:
          if (!reason) return false;
          await this.mailGunService.sendRealIdFailedEmail(
            user.email,
            user.handle,
            reason
          );
          return true;
      }
    } catch (error) {
      this.logger.debug('Error sending real id email: ', { error });
      return false;
    }
  }

  async rejectVerifiedRealId(uid: string, reason: string): Promise<boolean> {
    try {
      const user = await this.userService.findById(uid);
      if (!user) return false;
      if (!user.email) return false;
      await this.mailGunService.sendVerifiedRealIDUserRejectionEmail(
        user.email,
        user.handle,
        reason
      );
      this.logger.debug('Reject real id sent', { user: user.id, reason });
      return true;
    } catch (error) {
      this.logger.debug('Error sending real id email: ', { error });
      return false;
    }
  }
}
