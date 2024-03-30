import { Inject, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { MailGunService } from '@verdzie/server/mail-gun/mail-gun.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class MailService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly mailGunService: MailGunService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
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
      methodName: MailService.prototype.sendContactUsEmail.name,
    };
    const result = await this.mailGunService.sendContactUsEmail({
      from,
      subject,
      body,
      name,
    });
    if (result.isErr()) {
      this.logger.error('failed to send contact us email', {
        ...context,
        error: result.error,
      });
      return err(result.error);
    }
    return ok(true);
  }
}
