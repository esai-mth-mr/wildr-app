import { TestingModule } from '@nestjs/testing';
import { CommentResolver } from './comment.resolver';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { CommentFake } from '../comment/testing/comment.fake';
import { CommentEntityFake } from '../comment/testing/comment-entity.fake';
import { UserEntityFake } from '../user/testing/user-entity.fake';
import { FlagOperationType, ReactionType } from '../generated-graphql';
import { AppContext, newAppContext } from '../common';
import { CommentEntity } from '../comment/comment.entity';
import { PostEntityFake } from '../post/testing/post.fake';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ok } from 'neverthrow';

describe('CommentResolver', () => {
  let resolver: CommentResolver;
  let module: TestingModule;

  beforeEach(async () => {
    module = await createMockedTestingModule({ providers: [CommentResolver] });
    resolver = module.get(CommentResolver);
  });

  describe('getComment', () => {
    it('should return the comment transformed to meet gql schema', async () => {
      const comment = CommentEntityFake();
      const context = { comments: {} };

      resolver['commentService'].findOneWithAuthorization = jest
        .fn()
        .mockResolvedValue(comment);
      resolver['commentService'].toCommentObject = jest
        .fn()
        .mockImplementation(i => 'gqlCommentObject');

      const result = await resolver.getComment(
        { id: comment.id },
        context as AppContext
      );

      expect(result).toEqual({
        __typename: 'GetCommentResult',
        comment: 'gqlCommentObject',
      });
    });

    it('should search for comment with author', async () => {
      const comment = CommentEntityFake();
      const context = { comments: {} };
      const currentUser = UserEntityFake();

      resolver['commentService'].findOneWithAuthorization = jest
        .fn()
        .mockResolvedValue(comment);
      resolver['commentService'].toCommentObject = jest
        .fn()
        .mockImplementation(i => 'gqlCommentObject');

      await resolver.getComment(
        { id: comment.id },
        context as AppContext,
        currentUser
      );

      expect(
        resolver['commentService'].findOneWithAuthorization
      ).toBeCalledWith(comment.id, currentUser, {
        relations: [CommentEntity.kAuthorRelation],
      });
    });

    it('should add the comment entity with author to context', async () => {
      const comment = CommentEntityFake();
      const context = { comments: {} };
      const currentUser = UserEntityFake();

      resolver['commentService'].findOneWithAuthorization = jest
        .fn()
        .mockResolvedValue(comment);
      resolver['commentService'].toCommentObject = jest
        .fn()
        .mockImplementation(i => 'gqlCommentObject');

      await resolver.getComment(
        { id: comment.id },
        context as AppContext,
        currentUser
      );

      // @ts-ignore
      expect(context.comments[comment.id]).toEqual(comment);
    });
  });

  describe('commentContext', () => {
    it('should return undefined if user is logged out', async () => {
      const result = await resolver.commentContext(CommentFake(), undefined);

      expect(result).toBeUndefined();
    });

    it('should call comment service correctly and return response', async () => {
      const expectedResult = { liked: true };
      const comment = CommentFake();
      const user = UserEntityFake();

      resolver['commentService'].getContext = jest
        .fn()
        .mockResolvedValue(expectedResult);

      const result = await resolver.commentContext(comment, user);

      expect(result).toBe(expectedResult);
    });
  });

  describe('reactionsConnection', () => {
    it('should retrieve reactors from comment service and return them', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      const comment = CommentFake();
      // @ts-ignore
      resolver['userService'].toUserObject = i => i?.user;
      resolver['commentService'].getReactions = jest.fn().mockResolvedValue({
        users,
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
      });
      const result = await resolver.reactionsConnection(
        comment,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      expect(resolver['commentService'].getReactions).toBeCalledWith(
        comment.id,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      const edges = users.map(u => ({
        __typename: 'CommentReactionsEdge',
        cursor: u.id,
        node: u,
      }));
      expect(result?.__typename).toBe('CommentReactionsConnection');
      expect(result?.edges).toHaveLength(2);
      expect(result?.count).toBe(2);
      // @ts-ignore
      expect(result?.edges[0]).toMatchObject(edges[0]);
      expect(result?.pageInfo).toMatchObject({
        __typename: 'PageInfo',
        startCursor: users[0].id,
        endCursor: users[1].id,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should filter out users that are not found', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      const comment = CommentFake();
      // @ts-ignore
      resolver['userService'].toUserObject = i => i?.user;
      resolver['commentService'].getReactions = jest.fn().mockResolvedValue({
        users: [...users, undefined],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
      });
      const result = await resolver.reactionsConnection(
        comment,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      const edges = users.map(u => ({
        __typename: 'CommentReactionsEdge',
        cursor: u.id,
        node: u,
      }));
      expect(result?.__typename).toBe('CommentReactionsConnection');
      expect(result?.edges).toHaveLength(2);
      expect(result?.count).toBe(2);
      // @ts-ignore
      expect(result?.edges[0]).toMatchObject(edges[0]);
      expect(result?.pageInfo).toMatchObject({
        __typename: 'PageInfo',
        startCursor: users[0].id,
        endCursor: users[1].id,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should return empty array if no reactors are found', async () => {
      const comment = CommentFake();
      resolver['commentService'].getReactions = jest
        .fn()
        .mockResolvedValue(undefined);
      const result = await resolver.reactionsConnection(
        comment,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      expect(result).toBeUndefined();
    });
  });

  describe('reactOnComment', () => {
    it('should call reactOnComment', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      const context = newAppContext();
      resolver['commentService'].reactOnComment = jest
        .fn()
        .mockResolvedValue(comment);
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      const result = await resolver.reactOnComment(
        {
          commentId: comment.id,
          reaction: ReactionType.LIKE,
        },
        context,
        currentUser
      );
      expect(resolver['commentService'].reactOnComment).toHaveBeenCalledWith({
        commentId: comment.id,
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      // @ts-expect-error
      expect(result.comment).toMatchObject(comment);
    });

    it('should add the challenge from challenge interaction data', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['commentService'].reactOnComment = jest
        .fn()
        .mockResolvedValue(comment);
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.reactOnComment(
        {
          commentId: comment.id,
          reaction: ReactionType.LIKE,
        },
        context,
        currentUser
      );
      // @ts-expect-error
      expect(result.comment).toMatchObject(comment);
      // @ts-expect-error
      expect(result.challenge).toMatchObject(challenge);
    });
  });

  describe('flagComment', () => {
    it('should call flagComment with correct args', async () => {
      const comment = CommentEntityFake();
      const ctx = { posts: {} } as AppContext;
      const currentUser = UserEntityFake();
      const input = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const parentPost = PostEntityFake();

      resolver['commentService'].flagComment = jest
        .fn()
        .mockResolvedValue(comment);
      resolver['commentService'].toCommentObject = jest
        .fn()
        .mockImplementation(c => c);
      resolver['postService'].findById = jest
        .fn()
        .mockResolvedValue(parentPost);
      resolver['postService'].getCommentCountForUser = jest
        .fn()
        .mockResolvedValue(2);

      const result = await resolver.flagComment(input, ctx, currentUser);

      expect(result).toMatchObject({
        __typename: 'FlagCommentResult',
        comment,
      });
      expect(resolver['commentService'].flagComment).toHaveBeenCalledWith(
        input,
        ctx,
        currentUser
      );
    });

    it('should return comment and parentPost', async () => {
      const comment = CommentEntityFake();
      const parentPost = PostEntityFake();
      comment.post = parentPost;
      const ctx = { posts: {} } as AppContext;
      const currentUser = UserEntityFake();
      const input = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };

      resolver['commentService'].flagComment = jest
        .fn()
        .mockResolvedValue(comment);
      resolver['commentService'].toCommentObject = jest
        .fn()
        .mockImplementation(c => c);
      resolver['postService'].toGqlPostObject = jest
        .fn()
        .mockImplementationOnce(p => p);

      const result = await resolver.flagComment(input, ctx, currentUser);

      expect(resolver['commentService'].toCommentObject).toHaveBeenCalledWith(
        comment
      );
      expect(resolver['postService'].toGqlPostObject).toHaveBeenCalledWith(
        parentPost
      );

      expect(result).toEqual({
        __typename: 'FlagCommentResult',
        comment,
        parentPost,
      });
    });
  });

  describe('pinComment', () => {
    it('should add the challenge from challenge interaction data', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake();
      const comment = CommentEntityFake({ postId: post.id });
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['postService'].pinComment = jest
        .fn()
        .mockResolvedValue(ok({ pinnedComment: comment, post }));
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.pinComment(
        {
          commentId: comment.id,
          postId: comment.postId,
        },
        currentUser,
        context
      );
      // @ts-expect-error
      expect(result.challenge).toMatchObject(challenge);
    });

    it('should only return a challenge if a challenge interaction occurred', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      const comment = CommentEntityFake({ challengeId: challenge.id });
      const context = newAppContext();
      context.challengeInteractionData.challenge = undefined;
      resolver['challengeCommentService'].pinComment = jest
        .fn()
        .mockResolvedValue(ok({ pinnedComment: comment, challenge }));
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.pinComment(
        {
          commentId: comment.id,
          challengeId: comment.challengeId,
        },
        currentUser,
        context
      );
      // @ts-expect-error
      expect(result.challenge).toBe(null);
    });
  });

  describe('addComment', () => {
    it('should add a challenge from challenge interaction data', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake();
      const comment = CommentEntityFake({ postId: post.id });
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['postService'].addComment = jest
        .fn()
        .mockResolvedValue(ok({ comment, post }));
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.addComment(
        {
          postId: post.id,
          content: {} as any,
        } as any,
        currentUser,
        context
      );
      // @ts-expect-error
      expect(result.challenge).toMatchObject(challenge);
    });

    it('should only return a challenge if a challenge interaction occurred', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      const comment = CommentEntityFake({ challengeId: challenge.id });
      const context = newAppContext();
      context.challengeInteractionData.challenge = undefined;
      resolver['challengeCommentService'].addComment = jest
        .fn()
        .mockResolvedValue(ok({ comment, challenge }));
      // @ts-expect-error
      resolver['commentService'].toCommentObject = c => c;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.addComment(
        {
          challengeId: comment.challengeId,
          content: {} as any,
        } as any,
        currentUser,
        context
      );
      // @ts-expect-error
      expect(result.challenge).toBe(null);
    });
  });
});
