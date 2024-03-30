import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import Mailgun from 'mailgun.js';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { Result, err, ok } from 'neverthrow';
import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

// eslint-disable-next-line
const formData = require('form-data');

@Injectable()
export class MailGunService {
  private client: any;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.client = new Mailgun(formData).client({
      username: 'api',
      key: SSMParamsService.Instance.mailGunParams.MAIL_GUN_API_KEY!,
    });
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  private sendEmailCommons(
    toEmail: string,
    subject: string,
    template: string,
    variables: any,
    from = 'Wildr <donotreply@wildr.com>'
  ) {
    return new Promise((resolve, reject) => {
      this.client.messages
        .create(SSMParamsService.Instance.mailGunParams.MAIL_GUN_DOMAIN!, {
          from: from,
          to: toEmail,
          subject: subject,
          template: template,
          'h:X-Mailgun-Variables': JSON.stringify(variables),
        })
        .then((res: any) => resolve(res))
        .catch((error: any) => reject(error));
    });
  }

  async sendEmailVerificationEmail(email: string, link: string) {
    await this.sendEmailCommons(
      email,
      'Please verify your email address',
      'email_verification',
      { link }
    );
  }

  async sendRealIdPassedEmail(email: string, handle: string) {
    await this.sendEmailCommons(
      email,
      "You're Real ID verified! ✅",
      'real_id_verified',
      { handle }
    );
  }

  async sendRealIdFailedEmail(email: string, handle: string, reason: string) {
    await this.sendEmailCommons(
      email,
      "Sorry, we couldn't verify your Real ID 😔",
      'real_id_failed',
      { handle, reason }
    );
  }

  async sendReportEmail(
    email: string,
    handle: string,
    reason: string,
    link: string,
    sectionNumber: number,
    section: string,
    reportId: string
  ) {
    await this.sendEmailCommons(email, 'Your post was reported', 'report', {
      handle,
      reason,
      link,
      sectionNumber,
      section,
      reportId,
    });
  }

  async sendVerifiedRealIDUserRejectionEmail(
    email: string,
    handle: string,
    reason: string
  ) {
    await this.sendEmailCommons(
      email,
      'Your Wildr Verification was rejected',
      'real_id_reject_verified',
      {
        handle,
        reason,
      }
    );
  }

  async sendContactUsEmail({
    from,
    subject,
    body,
    name,
  }: {
    from: string;
    subject: string;
    body: string;
    name?: string;
  }): Promise<Result<boolean, InternalServerErrorException>> {
    const context = {
      from,
      subject,
      methodName: MailGunService.prototype.sendContactUsEmail.name,
    };
    try {
      this.logger.info('sending contact us email', context);
      let text = body + '\n\nfrom: ' + from;
      if (name) {
        text += '\nname: ' + name;
      }
      await this.client.messages.create(
        SSMParamsService.Instance.mailGunParams.MAIL_GUN_DOMAIN!,
        {
          from: WILDR_MAIL_GUN_EMAIL,
          subject: WILDR_CONTACT_US_SUBJECT_PREFIX + subject,
          text,
          to: WILDR_CONTACT_US_EMAIL,
        }
      );
      return ok(true);
    } catch (error) {
      this.logger.error('error sending contact us email', {
        ...context,
        error,
      });
      return err(
        new InternalServerErrorException('error sending contact us email', {
          error,
          ...context,
        })
      );
    }
  }
}

export const WILDR_CONTACT_US_EMAIL = 'contact@wildr.com';
export const WILDR_MAIL_GUN_EMAIL = 'wildrbot@wildr.com';
const WILDR_CONTACT_US_SUBJECT_PREFIX = 'Contact Us: ';

export class EmailSendException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes>) {
    super('error sending email', {
      ...debugData,
      code: InternalServerErrorExceptionCodes.EMAIL_SEND_ERROR,
    });
  }
}
