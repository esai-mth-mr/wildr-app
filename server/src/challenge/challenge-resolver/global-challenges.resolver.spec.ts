import { GlobalChallengesResolver } from '@verdzie/server/challenge/challenge-resolver/global-challenges.resolver';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { newAppContext } from '@verdzie/server/common';
import { ChallengeListType } from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { ok } from 'neverthrow';

describe('GlobalChallengesResolver', () => {
  let resolver: GlobalChallengesResolver;

  beforeEach(async () => {
    resolver = (
      await createMockedTestingModule({
        providers: [GlobalChallengesResolver],
      })
    ).get(GlobalChallengesResolver);
  });

  const getPageInfoForChallenges = (challenges: any[]) => ({
    hasNextPage: false,
    hasPreviousPage: false,
    count: challenges.length,
    totalCount: challenges.length,
    startCursor: challenges[0].id,
    endCursor: challenges[challenges.length - 1].id,
  });

  describe('getChallenges', () => {
    it('should pass correct input', async () => {
      const challenges = Array.from({ length: 10 }, () =>
        ChallengeEntityFake()
      );
      const pageInfo = getPageInfoForChallenges(challenges);
      resolver['service'].getChallenges = jest.fn().mockResolvedValue(
        ok({
          items: challenges,
          pageInfo: pageInfo,
        })
      );
      resolver['service'].toGqlChallengeObject = jest
        .fn()
        .mockImplementation(c => c);
      await resolver.getChallenges(
        { type: ChallengeListType.ALL, paginationInput: { take: 10 } },
        newAppContext(),
        undefined
      );
      expect(resolver['service'].getChallenges).toHaveBeenCalledWith({
        input: { type: ChallengeListType.ALL, paginationInput: { take: 10 } },
        currentUser: undefined,
      });
    });

    it('should return challenges formatted as edges', async () => {
      const challenges = Array.from({ length: 10 }, () =>
        ChallengeEntityFake()
      );
      const pageInfo = getPageInfoForChallenges(challenges);
      resolver['service'].getChallenges = jest.fn().mockResolvedValue(
        ok({
          items: challenges,
          pageInfo: pageInfo,
        })
      );
      resolver['service'].toGqlChallengeObject = jest
        .fn()
        .mockImplementation(c => c);
      const result = await resolver.getChallenges(
        { type: ChallengeListType.ALL, paginationInput: { take: 10 } },
        newAppContext(),
        undefined
      );
      expect(result.__typename).toEqual('GetChallengesResult');
      if (result.__typename === 'GetChallengesResult') {
        expect(result.pageInfo).toEqual({
          __typename: 'PageInfo',
          ...pageInfo,
        });
        expect(result.edges).toHaveLength(challenges.length);
        challenges.forEach((challenge, index) => {
          // @ts-expect-error (result may be undefined)
          expect(result.edges[index].node).toEqual(challenge);
          // @ts-expect-error (result may be undefined)
          expect(result.edges[index].cursor).toEqual(challenge.id);
        });
      }
    });

    it('should filter out undefined challenges', async () => {
      const challenges = Array.from({ length: 10 }, () =>
        ChallengeEntityFake()
      );
      // @ts-expect-error (challenges may be undefined)
      challenges[5] = undefined;
      const pageInfo = getPageInfoForChallenges(challenges.filter(c => c));
      resolver['service'].getChallenges = jest.fn().mockResolvedValue(
        ok({
          items: challenges,
          pageInfo: pageInfo,
        })
      );
      resolver['service'].toGqlChallengeObject = jest
        .fn()
        .mockImplementation(c => c);
      const result = await resolver.getChallenges(
        { type: ChallengeListType.ALL, paginationInput: { take: 10 } },
        newAppContext(),
        undefined
      );
      expect(result.__typename).toEqual('GetChallengesResult');
      if (result.__typename === 'GetChallengesResult') {
        expect(result.pageInfo).toEqual({
          __typename: 'PageInfo',
          ...pageInfo,
        });
        expect(result.edges).toHaveLength(challenges.length - 1);
        challenges
          .filter(c => c)
          .forEach((challenge, index) => {
            // @ts-expect-error (result may be undefined)
            expect(result.edges[index].node).toEqual(challenge);
            // @ts-expect-error (result may be undefined)
            expect(result.edges[index].cursor).toEqual(challenge.id);
          });
      }
    });

    it('should add challenges to context', async () => {
      const challenges = Array.from({ length: 10 }, () =>
        ChallengeEntityFake()
      );
      const pageInfo = getPageInfoForChallenges(challenges);
      resolver['service'].getChallenges = jest.fn().mockResolvedValue(
        ok({
          items: challenges,
          pageInfo: pageInfo,
        })
      );
      resolver['service'].toGqlChallengeObject = jest
        .fn()
        .mockImplementation(c => c);
      const context = newAppContext();
      await resolver.getChallenges(
        { type: ChallengeListType.ALL, paginationInput: { take: 10 } },
        context,
        undefined
      );
      challenges.forEach(challenge => {
        expect(context.challenges[challenge.id]).toEqual(challenge);
      });
    });
  });
});
