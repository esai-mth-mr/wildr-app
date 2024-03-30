import { Inject, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { InviteEdge, InviteState } from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class InviteListTransporter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService
  ) {
    this.logger = logger.child({ context: InviteListTransporter.name });
  }

  toGqlInviteEdge({
    user,
  }: {
    user: UserEntity;
  }): Result<InviteEdge, InternalServerErrorException> {
    const gqlUser = this.userService.toUserObject({
      user,
    });
    const inviteState = InviteState.JOINED_PENDING_VERIFICATION;
    return ok({
      __typename: 'InviteEdge',
      cursor: user.id,
      node: {
        state: inviteState,
        user: gqlUser,
      },
    });
  }
}
