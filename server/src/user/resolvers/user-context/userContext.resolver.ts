import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserService } from '@verdzie/server/user/user.service';
import { User } from '@verdzie/server/graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Inject, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { AppContext } from '@verdzie/server/common';

@Resolver('UserContext')
@UseGuards(OptionalJwtAuthGuard)
export class UserContextResolver {
  constructor(
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'UserContextResolver' });
  }

  @ResolveField('followingUser')
  async followingUser(
    @Parent() parent: User,
    @Context() ctx: AppContext,
    @Context('userToLookupFor') user?: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean> {
    this.logger.info('followingUser()', {});
    if (!currentUser || !user) {
      return false;
    }
    return await this.userService.isFollowing(currentUser.id, user.id);
  }

  @ResolveField('isInnerCircle')
  async isInnerCircle(
    @Parent() parent: User,
    @Context() ctx: AppContext,
    @Context('userToLookupFor') user?: User,
    @CurrentUser() currentUser?: UserEntity
  ) {
    // console.log(ctx);
    this.logger.info('isInnerCircle()', {
      ctx: ctx.userToLookupFor?.id,
      userToLookupFor: user?.id,
      currentUser: currentUser?.id,
      parent: parent.id ?? '000',
    });
    if (!currentUser || !user) {
      this.logger.info('currentUser or user not found', {});
      return false;
    }
    return await this.userService.isPartOfInnerCircle(currentUser.id, user.id);
  }
}
