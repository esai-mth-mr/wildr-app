import { Inject, Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { SomethingWentWrong } from '@verdzie/server/common';
import { WildrLanguageCode } from '@verdzie/server/common/language-code';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import {
  AddEmailToWaitlistInput,
  AddEmailToWaitlistOutput,
  AddUserToWaitlistInput,
  AddUserToWaitlistOutput,
  WaitlistType,
} from '@verdzie/server/generated-graphql';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import {
  AlreadyJoinedWildrcoinWaitlistException,
  UserEntity,
} from '@verdzie/server/user/user.entity';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import { waitlistCopyMap } from '@verdzie/server/waitlist/waitlist.copy';
import { WildrcoinWaitlistService } from '@verdzie/server/wildrcoin/wildrcoin-waitlist.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class WaitlistResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly wildrcoinWaitlistService: WildrcoinWaitlistService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Mutation('addUserToWaitlist')
  @WildrSpan()
  @UseFilters(SmartExceptionFilter)
  @UseGuards(JwtAuthGuard)
  async addUserToWaitlist(
    @CurrentUser() currentUser: UserEntity,
    @Args('input') input: AddUserToWaitlistInput
  ): Promise<AddUserToWaitlistOutput> {
    const logContext = {
      methodName: WaitlistResolver.prototype.addUserToWaitlist.name,
      userId: currentUser.id,
      waitlistType: input.waitlistType,
    };
    switch (input.waitlistType) {
      case WaitlistType.WILDRCOIN:
        const result = await this.wildrcoinWaitlistService.addUser({
          currentUser,
        });
        if (result.isErr()) {
          this.logger.error('error adding user to waitlist', {
            error: result.error,
            ...logContext,
          });
          if (result.error instanceof AlreadyJoinedWildrcoinWaitlistException) {
            return SomethingWentWrong(
              waitlistCopyMap[WildrLanguageCode.ENGLISH]
                .alreadyJoinedWaitlistExceptionMessage
            );
          } else if (
            result.error instanceof PostgresQueryFailedException ||
            result.error instanceof UserNotFoundException ||
            result.error instanceof PostgresUpdateFailedException ||
            result.error instanceof PostgresTransactionFailedException
          ) {
            return SomethingWentWrong();
          } else {
            const _exhaustiveCheck: never = result.error;
            this.logger.warn('unhandled error', logContext);
            return SomethingWentWrong();
          }
        }
        return {
          __typename: 'AddUserToWaitlistResult',
          success: true,
        };
      default:
        const _exhaustiveCheck: never = input.waitlistType;
        this.logger.error('unhandled waitlist type', logContext);
        return {
          __typename: 'AddUserToWaitlistResult',
          success: false,
        };
    }
  }

  @Mutation('addEmailToWaitlist')
  @WildrSpan()
  @UseFilters(SmartExceptionFilter)
  async addEmailToWaitlist(
    @Args('input') input: AddEmailToWaitlistInput
  ): Promise<AddEmailToWaitlistOutput> {
    const logContext = {
      methodName: WaitlistResolver.prototype.addEmailToWaitlist.name,
      email: input.email,
      waitlistType: input.waitlistType,
    };
    switch (input.waitlistType) {
      case WaitlistType.WILDRCOIN:
        const result = await this.wildrcoinWaitlistService.addEmail({
          email: input.email,
        });
        if (result.isErr()) {
          this.logger.error('error adding email to waitlist', {
            error: result.error,
            ...logContext,
          });
          if (result.error instanceof PostgresQueryFailedException) {
            return SomethingWentWrong();
          } else {
            const _exhaustiveCheck: never = result.error;
            this.logger.error('unhandled error', logContext);
            return SomethingWentWrong();
          }
        }
        return {
          __typename: 'AddEmailToWaitlistResult',
          success: true,
        };
      default:
        const _exhaustiveCheck: never = input.waitlistType;
        this.logger.error('unhandled waitlist type', logContext);
        return {
          __typename: 'AddEmailToWaitlistResult',
          success: false,
        };
    }
  }
}
