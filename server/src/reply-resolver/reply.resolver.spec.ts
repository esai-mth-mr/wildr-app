import { TestingModule } from '@nestjs/testing';
import { ReplyResolver } from './reply.resolver';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { ReplyEntityFake } from '../reply/testing/reply-entity.fake';
import { ReplyFake } from '../reply/testing/reply.fake';
import { UserEntityFake } from '../user/testing/user-entity.fake';
import { ReactionType } from '../generated-graphql';
import { ReplyEntity } from '../reply/reply.entity';
import { AppContext, newAppContext } from '../common';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { err, ok } from 'neverthrow';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';

describe('ReplyResolver', () => {
  let resolver: ReplyResolver;
  let module: TestingModule;

  beforeEach(async () => {
    module = await createMockedTestingModule({ providers: [ReplyResolver] });
    resolver = module.get<ReplyResolver>(ReplyResolver);
  });

  afterAll(async () => await module.close());

  describe('getReply', () => {
    it('should call reply service correctly and return converted response', async () => {
      const replyId = 'replyId';
      const reply = ReplyEntityFake({ id: replyId });
      const currentUser = UserEntityFake();
      const context = newAppContext();
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      resolver['replyService'].findOneWithVisibilityCheck = jest
        .fn()
        .mockResolvedValue({ reply, comment, parent });
      resolver['replyService'].toReplyObject = jest
        .fn()
        .mockImplementation(_ => 'converted');
      const result = await resolver.getReply(
        { id: replyId },
        context as AppContext,
        currentUser
      );
      expect(result.__typename).toBe('GetReplyResult');
      expect(
        resolver['replyService'].findOneWithVisibilityCheck
      ).toBeCalledWith(replyId, currentUser, {
        relations: [ReplyEntity.kAuthorRelation],
      });
      expect(resolver['replyService'].toReplyObject).toBeCalledWith(reply);
      // @ts-expect-error
      expect(result.reply).toBe('converted');
    });

    it('should add reply to context', async () => {
      const reply = ReplyEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      resolver['replyService'].findOneWithVisibilityCheck = jest
        .fn()
        .mockResolvedValue({
          reply,
          comment,
          parent,
        });
      resolver['replyService'].toReplyObject = jest
        .fn()
        .mockImplementation(_ => 'converted');
      await resolver.getReply(
        { id: reply.id },
        context as AppContext,
        currentUser
      );
      expect(context.reply).toBe(reply);
    });
  });

  describe('replyContext', () => {
    it('should return undefined if user is logged out', async () => {
      const result = await resolver.replyContext(ReplyFake(), undefined);
      expect(result).toBeUndefined();
    });

    it('should call reply service correctly and return response', async () => {
      const expectedResult = { liked: true };
      const reply = ReplyFake();
      const user = UserEntityFake();
      resolver['replyService'].getContext = jest
        .fn()
        .mockResolvedValue(expectedResult);
      const result = await resolver.replyContext(reply, user);
      expect(result).toBe(expectedResult);
    });
  });

  describe('reactionsConnection', () => {
    it('should retrieve reactors from reply service and return them', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      const reply = ReplyFake();
      // @ts-ignore
      resolver['userService'].toUserObject = i => i?.user;
      resolver['replyService'].getReactions = jest.fn().mockResolvedValue({
        users,
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
      });
      const result = await resolver.reactionsConnection(
        reply,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      const edges = users.map(u => ({
        __typename: 'ReplyReactionsEdge',
        cursor: u.id,
        node: u,
      }));
      expect(resolver['replyService'].getReactions).toBeCalledWith(
        reply.id,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      expect(result?.__typename).toBe('ReplyReactionsConnection');
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
      const reply = ReplyFake();
      // @ts-ignore
      resolver['userService'].toUserObject = i => i?.user;
      resolver['replyService'].getReactions = jest.fn().mockResolvedValue({
        users: [...users, undefined],
        hasNextPage: false,
        hasPreviousPage: false,
        count: 2,
      });
      const result = await resolver.reactionsConnection(
        reply,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      const edges = users.map(u => ({
        __typename: 'ReplyReactionsEdge',
        cursor: u.id,
        node: u,
      }));
      expect(result?.__typename).toBe('ReplyReactionsConnection');
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
      const reply = ReplyFake();
      resolver['replyService'].getReactions = jest
        .fn()
        .mockResolvedValue(undefined);
      const result = await resolver.reactionsConnection(
        reply,
        ReactionType.LIKE,
        { before: 'before', after: 'after' }
      );
      expect(result).toBeUndefined();
    });
  });

  describe('reactOnReply', () => {
    it('should call reactOnReply', async () => {
      const currentUser = UserEntityFake();
      const reply = ReplyEntityFake();
      const context = newAppContext();
      resolver['replyService'].reactOnReply = jest
        .fn()
        .mockResolvedValue(reply);
      // @ts-expect-error
      resolver['replyService'].toReplyObject = c => c;
      const result = await resolver.reactOnReply(
        {
          replyId: reply.id,
          reaction: ReactionType.UN_LIKE,
        },
        context,
        currentUser
      );
      expect(resolver['replyService'].reactOnReply).toHaveBeenCalledWith({
        replyId: reply.id,
        reactionType: ReactionType.UN_LIKE,
        currentUser,
        context,
      });
      // @ts-expect-error
      expect(result.reply).toMatchObject(reply);
    });

    it('should add the challenge from challenge interaction context if present', async () => {
      const currentUser = UserEntityFake();
      const reply = ReplyEntityFake();
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['replyService'].reactOnReply = jest
        .fn()
        .mockResolvedValue(reply);
      // @ts-expect-error
      resolver['replyService'].toReplyObject = r => r;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.reactOnReply(
        {
          replyId: reply.id,
          reaction: ReactionType.LIKE,
        },
        context,
        currentUser
      );
      expect(resolver['replyService'].reactOnReply).toHaveBeenCalledWith({
        replyId: reply.id,
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      // @ts-expect-error
      expect(result.reply).toMatchObject(reply);
      // @ts-expect-error
      expect(result.challenge).toMatchObject(challenge);
    });
  });

  describe('addReply', () => {
    it('should add a challenge from challenge interaction data', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      const reply = ReplyEntityFake();
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['replyService'].addReply = jest.fn().mockResolvedValue(
        ok({
          reply,
          comment,
        })
      );
      // @ts-expect-error
      resolver['replyService'].toReplyObject = r => r;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.addReply(
        {
          content: 'content',
          commentId: 'commentId',
        } as any,
        context,
        currentUser
      );
      expect(resolver['replyService'].addReply).toHaveBeenCalledWith({
        currentUser,
        context,
        input: {
          content: 'content',
          commentId: 'commentId',
        },
      });
      // @ts-expect-error
      expect(result.reply).toMatchObject(reply);
      // @ts-expect-error
      expect(result.challenge).toMatchObject(challenge);
    });

    it('should handle internal errors ', async () => {
      const currentUser = UserEntityFake();
      const context = newAppContext();
      const challenge = ChallengeEntityFake();
      context.challengeInteractionData.challenge = challenge;
      resolver['replyService'].addReply = jest
        .fn()
        .mockResolvedValue(
          err(
            new InternalServerErrorException(
              '[checkReplyAccess] only participants can reply'
            )
          )
        );
      // @ts-expect-error
      resolver['replyService'].toReplyObject = r => r;
      // @ts-expect-error
      resolver['challengeCommentService'].toGqlChallengeObject = c => c;
      const result = await resolver.addReply(
        {
          content: 'content',
          commentId: 'commentId',
        } as any,
        context,
        currentUser
      );
      expect(resolver['replyService'].addReply).toHaveBeenCalledWith({
        currentUser,
        context,
        input: {
          content: 'content',
          commentId: 'commentId',
        },
      });
      expect(result.__typename).toBe('SmartError');
    });
  });
});
