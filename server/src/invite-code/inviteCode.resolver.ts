import { Inject, UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  CheckAndRedeemInviteCodeInput,
  CheckAndRedeemInviteCodeOutput,
} from '../generated-graphql';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { InviteCodeAction } from '@verdzie/server/invite-code/inviteCode.helper';
import { InviteCodeActionService } from '@verdzie/server/invite-code/inviteCodeAction.service';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  CheckAndRedeemInviteCodeResult,
  InviteCodeService,
} from '@verdzie/server/invite-code/inviteCode.service';
import { SomethingWentWrong } from '@verdzie/server/common';

@Resolver()
export class InviteCodeResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly inviteCodeService: InviteCodeService,
    private readonly inviteCodeActionService: InviteCodeActionService
  ) {
    this.logger = this.logger.child({ context: 'InviteCodeResolver' });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async checkAndRedeemInviteCode(
    @Args('input', { type: () => CheckAndRedeemInviteCodeInput })
    input: CheckAndRedeemInviteCodeInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CheckAndRedeemInviteCodeOutput> {
    const context = { input, userId: currentUser?.id };
    this.logger.info('Redeeming invite code', context);
    const inviteCode = await this.inviteCodeService.findByInviteCode(
      input.code
    );
    if (!inviteCode) {
      return {
        __typename: 'CheckAndRedeemInviteCodeResult',
        hasBeenRedeemed: undefined,
        isValid: false,
      };
    }
    if (!inviteCode.action) {
      const result: CheckAndRedeemInviteCodeResult =
        await this.inviteCodeService.checkAndRedeem(
          inviteCode,
          currentUser?.id
        );
      if (result.hasError) return SomethingWentWrong();
      return {
        __typename: 'CheckAndRedeemInviteCodeResult',
        hasBeenRedeemed: result.hasBeenRedeemed,
        isValid: result.isValid,
      };
    }
    if (inviteCode.inviterId && currentUser?.id) {
      const ownerId = inviteCode.inviterId.trim();
      const redeemerId = currentUser.id;
      if (redeemerId === ownerId) {
        return {
          __typename: 'CheckAndRedeemInviteCodeResult',
          hasBeenRedeemed: false,
          isValid: false,
        };
      }
      switch (inviteCode.action) {
        case InviteCodeAction.ADD_TO_INNER_LIST:
          const addToInnerCircleResult =
            await this.inviteCodeActionService.addToInnerCircle(
              ownerId,
              redeemerId
            );
          if (addToInnerCircleResult == null) break;
          return addToInnerCircleResult;
        case InviteCodeAction.ADD_TO_FOLLOWING_LIST:
          const addToFollowingResult =
            await this.inviteCodeActionService.addToFollowing(
              ownerId,
              redeemerId
            );
          if (addToFollowingResult == undefined) break;
          return addToFollowingResult;
        case InviteCodeAction.SHARE_CHALLENGE:
          const result = await this.inviteCodeService.checkAndRedeem(
            inviteCode,
            currentUser?.id
          );
          if (result.hasError) return SomethingWentWrong();
          return {
            __typename: 'CheckAndRedeemInviteCodeResult',
            hasBeenRedeemed: result.hasBeenRedeemed,
            isValid: result.isValid,
          };
        default:
          const _exhaustiveCheck: never = inviteCode.action;
      }
    }
    this.logger.error('Unhandled invite code redeem request', context);
    return SomethingWentWrong();
  }
}
