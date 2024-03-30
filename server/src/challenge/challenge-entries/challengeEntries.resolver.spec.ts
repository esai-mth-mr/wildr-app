import { ChallengeEntryType } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeEntriesResolver } from '@verdzie/server/challenge/challenge-entries/challengeEntries.resolver';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { newAppContext } from '@verdzie/server/common';
import { PostService } from '@verdzie/server/post/post.service';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe('ChallengeEntriesResolver', () => {
  let resolver: ChallengeEntriesResolver;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeEntriesResolver, PostService],
    });
    resolver = module.get<ChallengeEntriesResolver>(ChallengeEntriesResolver);
  });

  describe('allEntriesConnection', () => {
    it('should return undefined if challenge not found', async () => {
      const result = await resolver.allEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(result).toBeUndefined();
    });

    it('should return empty connection if entries not found', async () => {
      const challenge = ChallengeEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      const result = await resolver.allEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(result).toEqual({
        __typename: 'ChallengeEntriesConnection',
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
          totalCount: 0,
        },
        edges: [],
        userToSearchForId: undefined,
      });
    });

    it('should call entriesService.getEntries with correct params', async () => {
      const challenge = ChallengeEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: [],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 0,
      });
      await resolver.allEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(resolver['entriesService'].getEntries).toBeCalledWith({
        challenge,
        paginationInput: { take: 10 },
        targetEntryId: undefined,
        currentUser: undefined,
        entryType: ChallengeEntryType.ALL,
      });
    });

    it('it should return correct page info', async () => {
      const challenge = ChallengeEntityFake();
      const posts = [
        PostEntityFake({ parentChallengeId: challenge.id }),
        PostEntityFake({ parentChallengeId: challenge.id }),
        PostEntityFake({ parentChallengeId: challenge.id }),
      ];
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: posts.map((p, i) => {
          return { post: p, isHidden: false, isPinned: false };
        }),
        hasMoreItems: false,
        hasPreviousItems: false,
        count: 3,
      });
      const result = await resolver.allEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(result?.pageInfo).toEqual({
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: posts[0].id,
        endCursor: posts[2].id,
        count: 3,
      });
    });

    it('should return posts with parentChallengeId, hidden status, and pinned status', async () => {
      const challenge = ChallengeEntityFake();
      const posts = [
        PostEntityFake({ parentChallengeId: challenge.id }),
        PostEntityFake({ parentChallengeId: challenge.id }),
        PostEntityFake({ parentChallengeId: challenge.id }),
      ];
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: posts.map((p, i) => {
          if (i == 0) {
            return {
              post: p,
              isHidden: true,
              isPinned: false,
            };
          } else if (i == 1) {
            return {
              post: p,
              isHidden: false,
              isPinned: true,
            };
          }
          return {
            post: p,
            isHidden: false,
            isPinned: false,
          };
        }),
        hasNextPage: false,
        hasPreviousPage: false,
        count: 3,
      });
      const result = await resolver.allEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      const edges = result?.edges;
      if (!edges) {
        fail();
      }
      expect(edges?.length).toEqual(3);
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        // Required so that isHidden and isPinned resolver fields don't perform
        // additional queries
        expect(edge.node.parentChallengeId).toEqual(challenge.id);
        expect(edge.node.id).toEqual(posts[i].id);
        expect(edge.node.isHiddenOnChallenge).toEqual(i == 0);
        expect(edge.node.isPinnedToChallenge).toEqual(i == 1);
      }
    });
  });

  describe('featuredEntriesConnection', () => {
    it('should call entriesService.getEntries with correct params', async () => {
      const challenge = ChallengeEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: [],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 0,
      });
      await resolver.featuredEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(resolver['entriesService'].getEntries).toBeCalledWith({
        challenge,
        paginationInput: { take: 10 },
        targetEntryId: undefined,
        currentUser: undefined,
        entryType: ChallengeEntryType.FEATURED,
      });
    });
  });

  describe('todayEntriesConnection', () => {
    it('should call entriesService.getEntries with correct params', async () => {
      const challenge = ChallengeEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: [],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 0,
      });
      await resolver.todayEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        undefined,
        undefined
      );
      expect(resolver['entriesService'].getEntries).toBeCalledWith({
        challenge,
        paginationInput: { take: 10 },
        targetEntryId: undefined,
        currentUser: undefined,
        entryType: ChallengeEntryType.TODAY,
      });
    });
  });

  describe('currentUserEntriesConnection', () => {
    it('should call entriesService.getEntries with correct params', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      resolver['entriesService'].getEntries = jest.fn().mockResolvedValueOnce({
        entries: [],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 0,
      });
      await resolver.userEntriesConnection(
        newAppContext(),
        'challengeId',
        { take: 10 },
        'otherUserId',
        undefined,
        currentUser
      );
      expect(resolver['entriesService'].getEntries).toBeCalledWith({
        challenge,
        paginationInput: { take: 10 },
        targetEntryId: undefined,
        currentUser,
        entryType: ChallengeEntryType.USER,
        userToSearchForId: 'otherUserId',
      });
    });
  });
});
