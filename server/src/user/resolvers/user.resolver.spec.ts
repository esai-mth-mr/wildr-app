import { PaginateFeedResponse } from '@verdzie/server/feed/feed.service';
import {
  OnboardingType,
  PaginationInput,
} from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserResolver } from './user.resolver';
import { err, ok } from 'neverthrow';

describe('UserResolver', () => {
  let resolver: UserResolver;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [UserResolver],
    });
    resolver = module.get<UserResolver>(UserResolver);
  });

  describe('skipOnboarding', () => {
    it('should call skip onboarding with input and currentUser', async () => {
      resolver['userService'].skipOnboarding = jest.fn();
      resolver['userService'].getOnboardingStats = jest.fn().mockResolvedValue({
        innerCircle: true,
        commentReplyLikes: false,
      });
      const input = { type: OnboardingType.INNER_CIRCLE };
      const currentUser = UserEntityFake();
      await resolver.skipOnboarding(input, currentUser);
      expect(resolver['userService'].skipOnboarding).toHaveBeenCalledWith(
        input,
        currentUser
      );
    });

    it('should return the result from getOnboardingStats', async () => {
      resolver['userService'].skipOnboarding = jest.fn();
      resolver['userService'].getOnboardingStats = jest.fn().mockResolvedValue({
        innerCircle: true,
        commentReplyLikes: false,
      });
      const input = { type: OnboardingType.INNER_CIRCLE };
      const currentUser = UserEntityFake();
      const result = await resolver.skipOnboarding(input, currentUser);
      // @ts-expect-error
      expect(result.innerCircle).toBe(true);
    });
  });

  describe('finishOnboarding', () => {
    it('should call finishOnboarding with input and currentUser', async () => {
      resolver['userService'].finishOnboarding = jest.fn();
      resolver['userService'].getOnboardingStats = jest.fn().mockResolvedValue({
        innerCircle: true,
        commentReplyLikes: false,
      });
      const input = { type: OnboardingType.INNER_CIRCLE };
      const currentUser = UserEntityFake();
      await resolver.finishOnboarding(input, currentUser);
      expect(resolver['userService'].finishOnboarding).toHaveBeenCalledWith(
        input,
        currentUser
      );
    });

    it('should return the result from getOnboardingStats', async () => {
      resolver['userService'].finishOnboarding = jest.fn();
      resolver['userService'].getOnboardingStats = jest.fn().mockResolvedValue({
        innerCircle: true,
        commentReplyLikes: false,
      });
      const input = { type: OnboardingType.INNER_CIRCLE };
      const currentUser = UserEntityFake();
      const result = await resolver.finishOnboarding(input, currentUser);
      // @ts-expect-error
      expect(result.innerCircle).toBe(true);
    });
  });

  describe('onboardingStats', () => {
    it('should return innerCircle, commentReplyLikes, challengeAuthorInteractions and challenges stats', async () => {
      resolver['userService'].getOnboardingStats = jest.fn().mockResolvedValue({
        innerCircle: true,
        commentReplyLikes: false,
        challengeAuthorInteractions: false,
        challenges: false,
      });
      const currentUser = UserEntityFake();
      const result = await resolver.onboardingStats(
        // @ts-expect-error
        { id: currentUser.id },
        currentUser
      );
      expect(result).toEqual({
        __typename: 'OnboardingStats',
        innerCircle: true,
        commentReplyLikes: false,
        challengeAuthorInteractions: false,
        challenges: false,
      });
    });
  });

  describe(UserResolver.prototype.invitesConnection.name, () => {
    it('should return if user is not authenticated', async () => {
      const result = await resolver.invitesConnection(
        // @ts-expect-error
        { id: 1 },
        null
      );
      expect(result).toBeUndefined();
    });

    it('should paginate invite list', async () => {
      const invitedUser = UserEntityFake();
      const response: PaginateFeedResponse<UserEntity> = {
        items: [invitedUser],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '1',
          count: 1,
          totalCount: 1,
        },
      };
      resolver['inviteListService'].paginateInvites = jest
        .fn()
        .mockResolvedValue(ok(response));
      resolver['inviteListTransporter'].toGqlInviteEdge = jest
        .fn()
        .mockImplementation(({ user }) => {
          return ok({
            cursor: user.id,
            node: user,
          });
        });
      const paginationInput: PaginationInput = {
        take: 10,
        after: '1',
      };
      const currentUser = UserEntityFake();
      const result = await resolver.invitesConnection(
        { paginationInput },
        currentUser
      );
      expect(result).toEqual({
        __typename: 'InvitesConnection',
        edges: [
          {
            cursor: invitedUser.id,
            node: invitedUser,
          },
        ],
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '1',
          count: 1,
          totalCount: 1,
        },
      });
      expect(
        resolver['inviteListService'].paginateInvites
      ).toHaveBeenCalledWith({
        paginationInput,
        currentUser,
      });
    });

    it('should return if invite user retrieval fails', async () => {
      resolver['inviteListService'].paginateInvites = jest
        .fn()
        .mockResolvedValue(err({}));
      const result = await resolver.invitesConnection(
        // @ts-expect-error
        { id: 1 },
        UserEntityFake()
      );
      expect(result).toBeUndefined();
    });

    it('should return if invite user transformation fails', async () => {
      const invitedUser = UserEntityFake();
      const response: PaginateFeedResponse<UserEntity> = {
        items: [invitedUser],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '1',
          count: 1,
          totalCount: 1,
        },
      };
      resolver['inviteListService'].paginateInvites = jest
        .fn()
        .mockResolvedValue(ok(response));
      resolver['inviteListTransporter'].toGqlInviteEdge = jest
        .fn()
        .mockImplementation(({ user }) => {
          return err({});
        });
      const paginationInput: PaginationInput = {
        take: 10,
      };
      const result = await resolver.invitesConnection(
        { paginationInput },
        UserEntityFake()
      );
      expect(result).toBeUndefined();
    });
  });
});
