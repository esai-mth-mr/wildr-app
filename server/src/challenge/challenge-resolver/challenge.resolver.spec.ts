import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { ChallengeResolver } from '@verdzie/server/challenge/challenge-resolver/challenge.resolver';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import {
  Challenge,
  CommentVisibilityAccess,
} from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { ok } from 'neverthrow';

describe('ChallengeResolver', () => {
  let resolver: ChallengeResolver;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeResolver],
    });
    resolver = module.get(ChallengeResolver);
  });

  describe('authorInteractionCount', () => {
    it('should return the author interaction count', async () => {
      resolver[
        'challengeInteractionService'
      ].getChallengeAuthorInteractionsForToday = jest
        .fn()
        .mockResolvedValue([]);
      const result = await resolver.authorInteractionsConnection(
        { id: '1' } as any,
        { timezoneOffset: 'UTC' } as any,
        { id: '2' } as any
      );
      expect(result).toEqual({
        __typename: 'ChallengeAuthorInteractionConnection',
        interactionCount: 0,
      });
    });

    it('should return if the user is not authenticated', async () => {
      const result = await resolver.authorInteractionsConnection(
        { id: '1' } as any,
        { timezoneOffset: 'UTC' } as any
      );
      expect(result).toBe(undefined);
    });

    it('should return if the timezone is not provided', async () => {
      const result = await resolver.authorInteractionsConnection(
        { id: '1' } as any,
        { timezoneOffset: 'UTC' } as any
      );
      expect(result).toBe(undefined);
    });
  });

  describe('leaderboardConnection', () => {
    it('should return leaderboard entries with post, user, isCreator, and entryCount', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      resolver['postService'].toGqlPostObject = jest
        .fn()
        .mockImplementation(a => a);
      resolver['userService'].toUserObject = jest
        .fn()
        .mockImplementation(a => a);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['challengeLeaderboardService'].paginateLeaderboardParticipants =
        jest.fn().mockResolvedValue({
          hasNextPage: false,
          hasPreviousPage: false,
          rawEdges: [
            {
              cursor: '1',
              user: {
                id: '1',
                handle: 'handle',
              },
              post: {
                id: '1',
              },
              entryCount: 300,
              isCreator: true,
            },
            {
              cursor: '2',
              user: {
                id: '2',
                handle: 'handle',
              },
              post: {
                id: '2',
              },
              entryCount: 1,
              isCreator: false,
            },
          ],
        });
      const result = await resolver.leaderboardConnection(
        {} as any,
        challenge.id,
        {
          take: 10,
        },
        currentUser
      );
      expect(result.edges).toHaveLength(2);
      expect(result.edges).toEqual([
        {
          cursor: '1',
          node: {
            user: {
              user: {
                id: '1',
                handle: 'handle',
              },
            },
            post: {
              id: '1',
            },
            entryCount: 300,
            isCreator: true,
          },
        },
        {
          cursor: '2',
          node: {
            user: {
              user: {
                id: '2',
                handle: 'handle',
              },
            },
            post: {
              id: '2',
            },
            entryCount: 1,
            isCreator: false,
          },
        },
      ]);
      expect(result.pageInfo).toEqual({
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
        startCursor: '1',
        endCursor: '2',
      });
    });

    it('should return the correct page info', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      resolver['postService'].toGqlPostObject = jest
        .fn()
        .mockImplementation(a => a);
      resolver['userService'].toUserObject = jest
        .fn()
        .mockImplementation(a => a);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['challengeLeaderboardService'].paginateLeaderboardParticipants =
        jest.fn().mockResolvedValue({
          hasNextPage: false,
          hasPreviousPage: false,
          rawEdges: [
            {
              cursor: '1',
              user: {
                id: '1',
                handle: 'handle',
              },
              post: {
                id: '1',
              },
              entryCount: 300,
              isCreator: true,
            },
            {
              cursor: '2',
              user: {
                id: '2',
                handle: 'handle',
              },
              post: {
                id: '2',
              },
              entryCount: 1,
              isCreator: false,
            },
          ],
        });
      const result = await resolver.leaderboardConnection(
        {} as any,
        challenge.id,
        {
          take: 10,
        },
        currentUser
      );
      expect(result.pageInfo).toEqual({
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
        startCursor: '1',
        endCursor: '2',
      });
    });
  });

  describe('commentVisibilityAccessControlContext', () => {
    it('should return no errors if user can view comments', async () => {
      const challenge = ChallengeEntityFake();
      challenge.accessControl = {
        commentVisibilityAccessData: {
          access: CommentVisibilityAccess.EVERYONE,
        },
      } as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      const currentUser = UserEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['challengeCommentService'].canViewCommentsStatusAndMessage = jest
        .fn()
        .mockResolvedValue({
          canViewComments: true,
        });
      const result = await resolver.commentVisibilityAccessControlContext(
        challenge as Challenge,
        {} as any,
        currentUser
      );
      expect(result?.canViewComment).toBe(true);
    });

    it('should return error messages if provided by access control check', async () => {
      const challenge = ChallengeEntityFake();
      challenge.accessControl = {
        commentVisibilityAccessData: {
          access: CommentVisibilityAccess.EVERYONE,
        },
      } as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      const currentUser = UserEntityFake();
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['challengeCommentService'].canViewCommentsStatusAndMessage = jest
        .fn()
        .mockResolvedValue({
          canViewComments: false,
          errorMessage: 'Only challenge participants can view comments',
        });
      const result = await resolver.commentVisibilityAccessControlContext(
        challenge as Challenge,
        {} as any,
        currentUser
      );
      expect(result?.canViewComment).toBe(false);
      expect(result?.cannotViewCommentErrorMessage).toBe(
        'Only challenge participants can view comments'
      );
    });
  });

  describe('commentPostingAccessControlContext', () => {
    it('should return no errors if user can post comments', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      const context = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [
            ChallengeResolver,
            {
              provide: ChallengeCommentService,
              useValue: {
                canCommentStatusAndMessage: jest.fn().mockResolvedValue(
                  ok({
                    canPostComment: true,
                  })
                ),
              },
            },
            {
              provide: ChallengeService,
              useValue: {
                getChallengeEntityFromContext: jest
                  .fn()
                  .mockResolvedValue(challenge),
              },
            },
          ],
        })
      ).get(ChallengeResolver);
      const result = await resolver.commentPostingAccessControlContext(
        challenge as Challenge,
        context,
        currentUser
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        context
      );
      expect(
        resolver['challengeCommentService'].canCommentStatusAndMessage
      ).toBeCalledWith({ userId: currentUser.id, challenge });
      expect(result?.canComment).toBe(true);
    });
  });

  it('should return error message if user is not allowed to comment', async () => {
    const challenge = ChallengeEntityFake();
    const currentUser = UserEntityFake();
    const context = {} as any;
    const resolver = (
      await createMockedTestingModule({
        providers: [
          ChallengeResolver,
          {
            provide: ChallengeCommentService,
            useValue: {
              canCommentStatusAndMessage: jest.fn().mockResolvedValue(
                ok({
                  canPostComment: false,
                  errorMessage: 'Only challenge participants can comment',
                })
              ),
            },
          },
          {
            provide: ChallengeService,
            useValue: {
              getChallengeEntityFromContext: jest
                .fn()
                .mockResolvedValue(challenge),
            },
          },
        ],
      })
    ).get(ChallengeResolver);
    const result = await resolver.commentPostingAccessControlContext(
      challenge as Challenge,
      context,
      currentUser
    );
    expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
      challenge.id,
      context
    );
    expect(
      resolver['challengeCommentService'].canCommentStatusAndMessage
    ).toBeCalledWith({ userId: currentUser.id, challenge });
    expect(result?.canComment).toBe(false);
    expect(result?.cannotCommentErrorMessage).toBe(
      'Only challenge participants can comment'
    );
  });

  describe('previewParticipants', () => {
    it('should return no participants if non are found', async () => {
      const challenge = ChallengeEntityFake();
      const ctx = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['service'].getPreviewParticipants = jest
        .fn()
        .mockResolvedValue([]);
      const result = await resolver.previewParticipants(
        challenge as Challenge,
        ctx
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        ctx
      );
      expect(resolver['service'].getPreviewParticipants).toBeCalledWith(
        challenge
      );
      expect(result).toBe(undefined);
    });

    it('should show one participant if one is found', async () => {
      const challenge = ChallengeEntityFake();
      const participants = [
        UserEntityFake({ handle: 'brian', name: 'brian last name' }),
      ];
      const ctx = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['service'].getPreviewParticipants = jest
        .fn()
        .mockResolvedValue(participants);
      const result = await resolver.previewParticipants(
        challenge as Challenge,
        ctx
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        ctx
      );
      expect(resolver['service'].getPreviewParticipants).toBeCalledWith(
        challenge
      );
      expect(result?.__typename).toBe('ChallengePreviewParticipants');
      expect(result?.participants?.length).toBe(1);
      expect(result?.displayText).toBe('brian');
    });

    it('should show two participants if two are found', async () => {
      const challenge = ChallengeEntityFake();
      const participants = [
        UserEntityFake({ handle: 'brian', name: 'brian test' }),
        UserEntityFake({ handle: 'steve', name: 'steve test' }),
      ];
      const ctx = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['service'].getPreviewParticipants = jest
        .fn()
        .mockResolvedValue(participants);
      const result = await resolver.previewParticipants(
        challenge as Challenge,
        ctx
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        ctx
      );
      expect(resolver['service'].getPreviewParticipants).toBeCalledWith(
        challenge
      );
      expect(result?.__typename).toBe('ChallengePreviewParticipants');
      expect(result?.participants?.length).toBe(2);
      expect(result?.displayText).toBe('brian and steve');
    });

    it('should show three participants if three are found', async () => {
      const challenge = ChallengeEntityFake();
      challenge.stats.participantCount = 3;
      const participants = [
        UserEntityFake({ handle: 'brian', name: 'brian lastname' }),
        UserEntityFake({ handle: 'steve', name: '' }),
        UserEntityFake({ handle: 'hank', name: 'Hank capitalH' }),
      ];
      const ctx = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['service'].getPreviewParticipants = jest
        .fn()
        .mockResolvedValue(participants);
      const result = await resolver.previewParticipants(
        challenge as Challenge,
        ctx
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        ctx
      );
      expect(resolver['service'].getPreviewParticipants).toBeCalledWith(
        challenge
      );
      expect(result?.__typename).toBe('ChallengePreviewParticipants');
      expect(result?.participants?.length).toBe(3);
      expect(result?.displayText).toBe('brian, steve and Hank');
    });

    it('should show more then three participants if more then three are found', async () => {
      const challenge = ChallengeEntityFake();
      challenge.stats.participantCount = 50;
      const participants = [
        UserEntityFake({ handle: 'brian', name: 'brian last name' }),
        UserEntityFake({ handle: 'steve', name: 'stevee' }),
        UserEntityFake({ handle: 'hank', name: '' }),
      ];
      const ctx = {} as any;
      const resolver = (
        await createMockedTestingModule({
          providers: [ChallengeResolver],
        })
      ).get(ChallengeResolver);
      resolver['service'].getChallengeEntityFromContext = jest
        .fn()
        .mockResolvedValue(challenge);
      resolver['service'].getPreviewParticipants = jest
        .fn()
        .mockResolvedValue(participants);
      const result = await resolver.previewParticipants(
        challenge as Challenge,
        ctx
      );
      expect(resolver['service'].getChallengeEntityFromContext).toBeCalledWith(
        challenge.id,
        ctx
      );
      expect(resolver['service'].getPreviewParticipants).toBeCalledWith(
        challenge
      );
      expect(result?.__typename).toBe('ChallengePreviewParticipants');
      expect(result?.participants?.length).toBe(3);
      expect(result?.displayText).toBe('brian, stevee and 48 others');
    });
  });
});
