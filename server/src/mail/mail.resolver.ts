import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { kSomethingWentWrong } from '@verdzie/server/common';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { SendContactUsEmailOutput } from '@verdzie/server/generated-graphql';
import { SendContactUsEmailInput } from '@verdzie/server/graphql';
import { MailService } from '@verdzie/server/mail/mail.service';
import { LowGqlRateLimiterGuard } from '@verdzie/server/rate-limiter/gql-rate-limiter.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Resolver()
export class MailResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly mailService: MailService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Mutation()
  @UseGuards(LowGqlRateLimiterGuard)
  @UseFilters(SmartExceptionFilter)
  async sendContactUsEmail(
    @Args('input', { type: () => SendContactUsEmailInput })
    input: SendContactUsEmailInput
  ): Promise<SendContactUsEmailOutput> {
    const context = {
      methodName: MailResolver.prototype.sendContactUsEmail.name,
      from: input.from,
    };
    const result = await this.mailService.sendContactUsEmail({
      name: input.name,
      from: input.from,
      subject: input.subject,
      body: input.body,
    });
    if (result.isErr()) {
      this.logger.error('failed to send contact us email', {
        ...context,
        error: result.error,
      });
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    return {
      __typename: 'SendContactUsEmailResult',
      success: true,
    };
  }
}
