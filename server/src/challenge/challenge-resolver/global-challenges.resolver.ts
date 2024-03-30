import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  ChallengeEdge,
  GetChallengesInput,
  GetChallengesOutput,
} from '@verdzie/server/generated-graphql';
import { AppContext, kSomethingWentWrong } from '@verdzie/server/common';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { isUserVisibleError } from '@verdzie/server/exceptions/wildr.exception';

//Responsible for returning All Challenges
@Resolver()
export class GlobalChallengesResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly service: ChallengeService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  async getChallenges(
    @Args('input') input: GetChallengesInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetChallengesOutput> {
    const challengeResult = await this.service.getChallenges({
      input,
      currentUser,
    });
    if (challengeResult.isErr()) {
      this.logger.error('error getting challenges', {
        error: challengeResult.error,
      });
      return {
        __typename: 'SmartError',
        message: isUserVisibleError(challengeResult.error)
          ? challengeResult.error.message
          : kSomethingWentWrong,
      };
    }
    const challengeList = challengeResult.value;
    const edges: ChallengeEdge[] = [];
    for (const challenge of challengeList.items) {
      if (!challenge) {
        this.logger.error('challenge is undefined', {
          input,
          userId: currentUser?.id,
        });
        continue;
      }
      context.challenges[challenge.id] = challenge;
      edges.push({
        __typename: 'ChallengeEdge',
        cursor: challenge.id,
        node: this.service.toGqlChallengeObject(challenge),
      });
    }
    return {
      __typename: 'GetChallengesResult',
      pageInfo: {
        __typename: 'PageInfo',
        ...challengeList.pageInfo,
      },
      edges,
    };
  }
}
