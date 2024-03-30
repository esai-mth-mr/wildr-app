import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '@verdzie/server/user/user.service';
import {
  ActivityObjectType,
  ActivityVerb,
  CheckAndRedeemInviteCodeResult,
} from '@verdzie/server/generated-graphql';

@Injectable()
export class InviteCodeActionService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService
  ) {
    this.logger = this.logger.child({ context: InviteCodeActionService.name });
  }

  async addToInnerCircle(
    ownerId: string,
    addedUserId: string
  ): Promise<CheckAndRedeemInviteCodeResult | undefined> {
    this.logger.info('ACTION = ADD_TO_INNER_LIST', {});
    const followResult = await this.followUser(ownerId, addedUserId);
    if (!followResult) return undefined;
    const result = await this.userService.addMemberToInnerCircle(
      ownerId,
      addedUserId,
      true,
      false
    );
    if (result) {
      this.logger.info('Added to inner circle successful', {});
      let body: string | undefined;
      if (!result.didAddEntry) {
        body = "You've already joined this Inner Circle!";
      } else {
        body = '@' + result.owner.handle + ' added you to their Inner Circle';
      }
      return {
        __typename: 'CheckAndRedeemInviteCodeResult',
        hasBeenRedeemed: true,
        isValid: true,
        payload: JSON.stringify({
          verb: ActivityVerb.ADDED_TO_IC, //Mentioned
          objectType: ActivityObjectType.USER,
          subjectId: ownerId,
          body,
        }),
      };
    }
  }

  async addToFollowing(
    ownerId: string,
    addedUserId: string
  ): Promise<CheckAndRedeemInviteCodeResult | undefined> {
    this.logger.info('ACTION = ADD_TO_FOLLOWING', {});
    const result = await this.followUser(ownerId, addedUserId, true);
    if (!result) return undefined;
    this.logger.info('Added to inner circle successful', {});
    return {
      __typename: 'CheckAndRedeemInviteCodeResult',
      hasBeenRedeemed: true,
      isValid: true,
      payload: JSON.stringify({
        verb: ActivityVerb.FOLLOWED,
        objectType: ActivityObjectType.USER,
        subjectId: ownerId,
      }),
    };
  }

  private async followUser(
    ownerId: string,
    addedUserId: string,
    shouldNotifyOfAutoAdd = false
  ): Promise<boolean> {
    const isFollowing = await this.userService.isFollowing(
      ownerId,
      addedUserId
    );
    this.logger.info('isFollowing', { isFollowing });
    if (!isFollowing) {
      this.logger.info('FOLLOWING NOW', {});
      const result = await this.userService.followUser(
        ownerId,
        addedUserId,
        shouldNotifyOfAutoAdd
      );
      return result != null;
    }
    return true;
  }
}
