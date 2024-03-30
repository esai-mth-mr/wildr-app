import { TestingModule } from '@nestjs/testing';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { ReplyEntityFake } from '@verdzie/server/reply/testing/reply-entity.fake';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { ReactionType } from '@verdzie/server/graphql';
import _ from 'lodash';
import {
  textSegmentIOFake,
  userSegmentIOFake,
} from '@verdzie/server/content/testing/content-io.fake';
import { newAppContext } from '@verdzie/server/common';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';

describe('ReplyService', () => {
  let module: TestingModule;
  let service: ReplyService;

  beforeEach(async () => {
    module = await createMockedTestingModule({ providers: [ReplyService] });
    service = module.get(ReplyService);
  });

  afterAll(async () => await module.close());

  describe('findByIdWithAuthor', () => {
    it('should return the reply with author', async () => {
      const reply = ReplyEntityFake();
      service['repo'].findOne = jest.fn().mockResolvedValue(reply);

      const result = await service.findByIdWithAuthor('replyId');

      expect(result).toBe(reply);
      expect(service['repo'].findOne).toHaveBeenCalledWith('replyId', {
        relations: [ReplyEntity.kAuthorRelation],
      });
    });
  });

  describe('reactOnReply', () => {
    it('should call addLike if reactionType is LIKE', async () => {
      const currentUser = UserEntityFake();
      const parent = PostEntityFake();
      const comment = CommentEntityFake({ postId: parent.id });
      const reply = ReplyEntityFake();
      const context = newAppContext();
      service['findByIdWithCommentParent'] = jest.fn().mockResolvedValue({
        comment,
        reply,
        parent,
      });
      service.addLike = jest.fn();
      service['accessControlService'].checkMessageReactionAccess = jest
        .fn()
        .mockResolvedValue(currentUser);
      service['addLike'] = jest.fn().mockResolvedValue({
        reply,
        comment,
        parent,
      });
      await service.reactOnReply({
        replyId: 'replyId',
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      expect(service.addLike).toHaveBeenCalledWith({
        reply,
        currentUser,
        comment,
        parent,
        context,
      });
      expect(service.findByIdWithCommentParent).toHaveBeenCalledWith({
        replyId: 'replyId',
      });
      expect(
        service['accessControlService'].checkMessageReactionAccess
      ).toHaveBeenCalledWith({
        object: parent,
        currentUser,
        messageType: 'reply',
        parentType: 'post',
      });
    });

    it('should call removeLike if reactionType is UN_LIKE', async () => {
      const currentUser = UserEntityFake();
      const reply = ReplyEntityFake();
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      reply.comment = comment;
      service['findByIdWithCommentParent'] = jest.fn().mockResolvedValue({
        comment,
        reply,
        parent,
      });
      service['accessControlService'].checkMessageReactionAccess = jest
        .fn()
        .mockResolvedValue(currentUser);
      service.removeLike = jest.fn();
      service['removeLike'] = jest.fn().mockResolvedValue(reply);
      await service.reactOnReply({
        replyId: 'replyId',
        reactionType: ReactionType.UN_LIKE,
        currentUser,
        context: newAppContext(),
      });
      expect(service.removeLike).toHaveBeenCalledWith(reply, currentUser);
      expect(service['findByIdWithCommentParent']).toHaveBeenCalledWith({
        replyId: 'replyId',
      });
      expect(
        service['accessControlService'].checkMessageReactionAccess
      ).toHaveBeenCalledWith({
        object: parent,
        currentUser,
        messageType: 'reply',
        parentType: 'post',
      });
    });
  });

  describe('addLike', () => {
    it(`should create the like feed if it does not exist`, async () => {
      const reply = ReplyEntityFake();
      const comment = CommentEntityFake();
      const likeFeed = FeedEntityFake({ _count: 0 });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(likeFeed),
      };
      const txManager = {
        save: jest.fn(),
        getRepository: () => feedRepo,
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            return await fn(txManager);
          },
        },
      };
      service['feedService'].createIfNotExists = jest.fn();
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: true };
        });
      service['notifyAuthorProducer'].reactionOnReply = jest.fn();
      const currentUser = UserEntityFake();
      // @ts-ignore
      await service.addLike({
        reply,
        comment,
        currentUser,
      });
      expect(service['feedService'].createIfNotExists).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
      );
    });

    it(`should update like feed and stats with additional like`, async () => {
      const reply = ReplyEntityFake();
      reply._stats.likeCount = 0;
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      service.findByIdWithAuthorAndParentComment = jest
        .fn()
        .mockResolvedValue(reply);
      const likeFeed = FeedEntityFake({ _count: 0 });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(likeFeed),
      };
      const txManager = {
        save: jest.fn(),
        getRepository: () => feedRepo,
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            return await fn(txManager);
          },
        },
      };
      service['feedService'].createIfNotExists = jest.fn();
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: true };
        });
      service['notifyAuthorProducer'].reactionOnReply = jest.fn();
      const currentUser = UserEntityFake();
      const { reply: resultingReply } = await service.addLike({
        reply,
        comment,
        currentUser,
        parent,
        context: newAppContext(),
      });
      expect(resultingReply._stats.likeCount).toBe(1);
      expect(feedRepo.findOne).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
      );
      expect(service['feedService'].tryAndPushEntry).toHaveBeenCalledWith(
        likeFeed.id,
        currentUser.id,
        { repo: feedRepo }
      );
      const savedReply = txManager.save.mock.calls[0][0];
      expect(savedReply._stats.likeCount).toBe(1);
      expect(
        service['notifyAuthorProducer'].reactionOnReply
      ).toHaveBeenCalledTimes(1);
    });

    it(`should throw and not save reply if the feed update fails`, async () => {
      const reply = ReplyEntityFake();
      reply._stats.likeCount = 0;
      const comment = CommentEntityFake();
      const parent = ChallengeEntityFake();
      const context = newAppContext();
      const likeFeed = FeedEntityFake({ _count: 0 });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(likeFeed),
      };
      const txManager = {
        save: jest.fn(),
        getRepository: () => feedRepo,
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            try {
              await fn(txManager);
            } catch {}
          },
        },
      };
      service['feedService'].createIfNotExists = jest.fn();
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockRejectedValue(new Error());
      service['notifyAuthorProducer'].reactionOnReply = jest.fn();
      const currentUser = UserEntityFake();
      await service.addLike({
        reply,
        comment,
        currentUser,
        parent,
        context,
      });
      expect(feedRepo.findOne).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
      );
      expect(service['feedService'].tryAndPushEntry).toHaveBeenCalledWith(
        likeFeed.id,
        currentUser.id,
        { repo: feedRepo }
      );
      expect(txManager.save).toHaveBeenCalledTimes(0);
      expect(
        service['notifyAuthorProducer'].reactionOnReply
      ).toHaveBeenCalledTimes(0);
    });

    it(`should not notify if user has already liked reply`, async () => {
      const reply = ReplyEntityFake();
      reply._stats.likeCount = 1;
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      const likeFeed = FeedEntityFake({ _count: 1 });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(likeFeed),
      };
      const txManager = {
        save: jest.fn(),
        getRepository: () => feedRepo,
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            await fn(txManager);
          },
        },
      };
      service['feedService'].createIfNotExists = jest.fn();
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          return { entity: feed, didAddEntry: false };
        });
      service['notifyAuthorProducer'].reactionOnReply = jest.fn();
      await service.addLike({ reply, currentUser, comment, parent, context });
      expect(
        service['notifyAuthorProducer'].reactionOnReply
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('removeLike', () => {
    it(`should remove the likes from reply like feed`, async () => {
      const userEntity = UserEntityFake();
      const replyEntity = ReplyEntityFake();
      replyEntity._stats.likeCount = 1;

      const feedRepo = {};
      const txManager = {
        getRepository: () => feedRepo,
        save: jest.fn(),
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            await fn(txManager);
          },
        },
      };

      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = FeedEntityFake({ _count: 1 });
          return { entity: feed, didRemoveEntry: true };
        });

      const result = await service.removeLike(replyEntity, userEntity);

      expect(result._stats.likeCount).toBe(1);

      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, replyEntity.id),
        userEntity.id,
        { repo: feedRepo }
      );

      const savedReply = txManager.save.mock.calls[0][0];
      expect(savedReply._stats.likeCount).toBe(1);
    });

    it(`should throw and not save reply if like removal fails`, async () => {
      const userEntity = UserEntityFake();
      const replyEntity = ReplyEntityFake();
      replyEntity._stats.likeCount = 1;

      const feedRepo = {};
      const txManager = {
        getRepository: () => feedRepo,
        save: jest.fn(),
      };

      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: async (fn: any) => {
            try {
              await fn(txManager);
            } catch {}
          },
        },
      };

      service['feedService'].removeEntry = jest
        .fn()
        .mockRejectedValue(new Error());

      await service.removeLike(replyEntity, userEntity);

      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, replyEntity.id),
        userEntity.id,
        { repo: feedRepo }
      );

      expect(txManager.save).toHaveBeenCalledTimes(0);
    });
  });

  describe('getContext', () => {
    it('should return liked as true if the user has a like in the feed', async () => {
      service['feedService'].findIndex = jest.fn().mockResolvedValue(2);
      const result = await service.getContext('cid', 'uid');
      expect(result.liked).toBe(true);
    });

    it('should return likes as false if the user has a like in the feed', async () => {
      service['feedService'].findIndex = jest.fn().mockResolvedValue(-1);
      const result = await service.getContext('cid', 'uid');
      expect(result.liked).toBe(false);
    });
  });

  describe('getReactions', () => {
    it('should return undefined if reply is not found', async () => {
      service['repo'].findOne = jest.fn().mockResolvedValue(undefined);
      const result = await service.getReactions(
        'replyId',
        ReactionType.LIKE,
        {}
      );
      expect(result).toBe(undefined);
    });

    it('should use passed in reply if provided', async () => {
      const reply = ReplyEntityFake();
      service['feedService'].find = jest.fn().mockResolvedValue(undefined);
      service['repo'].findOne = jest.fn();
      await service.getReactions(reply, ReactionType.LIKE, {});
      expect(service['repo'].findOne).not.toHaveBeenCalled();
    });

    it('should retrieve the like reaction feed if ReactionType is LIKE', async () => {
      const reply = ReplyEntityFake();
      service['feedService'].find = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['feedService'].getPage = jest
        .fn()
        .mockResolvedValue([FeedPageFake(), false, true]);
      service['userService'].findAllById = jest.fn().mockResolvedValue([]);
      await service.getReactions(reply, ReactionType.LIKE, {});
      expect(service['feedService'].find).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
      );
    });

    it('should return undefined if the feed is not found', async () => {
      const reply = ReplyEntityFake();
      service['feedService'].find = jest.fn().mockResolvedValue(undefined);
      const result = await service.getReactions(reply, ReactionType.LIKE, {});
      expect(result).toBe(undefined);
    });

    it('should return feed page, hasNextPage, hasPreviousPage, and feed count', async () => {
      const reply = ReplyEntityFake();
      const users = [UserEntityFake(), UserEntityFake()];
      const feed = FeedEntityFake();
      feed._count = 2;
      feed.ids = users.map(u => u.id);
      service['feedService'].find = jest.fn().mockResolvedValue(feed);
      const feedPage = FeedPageFake();
      feedPage.ids = users.map(u => u.id);
      service['feedService'].getPage = jest
        .fn()
        .mockResolvedValue([feedPage, false, false]);
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);
      const paginationInput = {
        after: 'after',
        before: 'before',
        pageNumber: 1,
      };
      const result = await service.getReactions(
        reply,
        ReactionType.LIKE,
        paginationInput
      );
      expect(result).toEqual({
        users,
        hasNextPage: false,
        hasPreviousPage: false,
        count: feed.count,
      });
      expect(service['feedService'].getPage).toHaveBeenCalledWith(
        { feedOrId: feed },
        paginationInput
      );
      expect(service['userService'].findAllById).toHaveBeenCalledWith(
        feedPage.ids
      );
    });
  });

  describe('notifyUsersMentionedInReply', () => {
    it('should create jobs for each user mentioned in reply', async () => {
      const reply = ReplyEntityFake();
      reply.content.segments = [
        {
          segment: userSegmentIOFake({ id: '1' }),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
      ];
      const result = await service.notifyUsersMentionedInReply({
        replyOrId: reply,
        commentAuthorId: '3',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const resultIds = Array.from(result.value.notifiedUsers);
        expect(resultIds).toEqual(['1', '2']);
      }
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledTimes(2);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledWith({
        objectId: '1',
        replyId: reply.id,
      });
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledWith({
        objectId: '2',
        replyId: reply.id,
      });
    });

    it('should not add jobs for the comment author as they are already notified', async () => {
      const reply = ReplyEntityFake();
      reply.content.segments = [
        {
          segment: userSegmentIOFake({ id: '1' }),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
      ];
      const result = await service.notifyUsersMentionedInReply({
        replyOrId: reply,
        commentAuthorId: '1',
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledTimes(1);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledWith({
        objectId: '2',
        replyId: reply.id,
      });
    });

    it('should not notify the reply author', async () => {
      const reply = ReplyEntityFake({ authorId: '1' });
      reply.content.segments = [
        {
          segment: userSegmentIOFake({ id: '1' }),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
      ];
      const result = await service.notifyUsersMentionedInReply({
        replyOrId: reply,
        commentAuthorId: '4',
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledTimes(1);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledWith({
        objectId: '2',
        replyId: reply.id,
      });
    });

    it('should not notify send duplicates to users mentioned multiple times', async () => {
      const reply = ReplyEntityFake();
      reply.content.segments = [
        {
          segment: userSegmentIOFake({ id: '1' }),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
      ];
      const result = await service.notifyUsersMentionedInReply({
        replyOrId: reply,
        commentAuthorId: '4',
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notifyAboutMentionProducer'].mentionedInReply
      ).toBeCalledTimes(2);
    });

    it('should handle unexpected errors', async () => {
      const reply = ReplyEntityFake();
      reply.content.segments = [
        {
          segment: userSegmentIOFake({ id: '1' }),
        },
        {
          segment: userSegmentIOFake({ id: '2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
      ];
      service['notifyAboutMentionProducer'].mentionedInReply = jest
        .fn()
        .mockRejectedValue(new Error('unexpected error'));
      const result = await service.notifyUsersMentionedInReply({
        replyOrId: reply,
        commentAuthorId: '4',
      });
      expect(result.isErr()).toBe(true);
    });
  });
});
