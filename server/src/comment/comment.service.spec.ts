import { TestingModule } from '@nestjs/testing';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import {
  CommentParentType,
  CommentService,
} from '@verdzie/server/comment/comment.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { ReactionType } from '@verdzie/server/graphql';
import { FlagOperationType } from '@verdzie/server/generated-graphql';
import _ from 'lodash';
import { AppContext, newAppContext } from '../common';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  tagSegmentIOFake,
  textSegmentIOFake,
  userSegmentIOFake,
} from '@verdzie/server/content/testing/content-io.fake';
import { ChallengeInteractionEnum } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';

function shuffleArray(array: any[]) {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
}

describe('CommentService', () => {
  let service: CommentService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await createMockedTestingModule({ providers: [CommentService] });
    service = module.get(CommentService);
  });

  describe('getRepo', () => {
    it('should favor passed in repo', () => {
      const opts = {
        repo: 'opts.repo',
        txManager: 'opts.txManager',
      } as any;
      expect(service.getRepo(opts)).toBe('opts.repo');
    });

    it('should use txManager to retrieve underlying comment repo if repo not present', () => {
      const opts = {
        txManager: {
          getRepository: jest.fn().mockReturnValue('opts.txManager'),
        },
      } as any;
      expect(service.getRepo(opts)).toBe('opts.txManager');
      expect(opts.txManager.getRepository).toHaveBeenCalledWith(CommentEntity);
    });

    it('should use underlying comment repo if txManager not present', () => {
      const opts = {} as any;
      expect(service.getRepo(opts)).toBe(service['repo'].repo);
    });
  });

  describe('findOneWithAuthorization', () => {
    it('should return the comment if all authorization checks pass', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });
      comment.flagMeta = undefined;

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);

      service['accessControlService'].checkMessageVisibilityAccess = jest.fn();

      const result = await service.findOneWithAuthorization(
        commentId,
        currentUser
      );

      expect(result).toBe(comment);
      expect(service['repo'].findOne).toHaveBeenCalledWith(commentId, {
        relations: ['post', 'challenge'],
      });
      expect(
        service['accessControlService'].checkMessageVisibilityAccess
      ).toHaveBeenCalledWith({
        object: comment.post,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
        message: comment,
      });
    });

    it('should throw if comment is not found', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });
      comment.flagMeta = undefined;

      service['repo'].findOne = jest.fn().mockResolvedValue(undefined);

      expect(
        service.findOneWithAuthorization(commentId, currentUser)
      ).rejects.toThrow();
    });

    it('should throw if comment is flagged', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: 'someOtherUserId',
            flaggedAt: new Date(),
          },
        ],
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);

      service['accessControlService'].checkMessageVisibilityAccess = jest.fn();

      expect(
        service.findOneWithAuthorization(commentId, currentUser)
      ).rejects.toThrowError('Comment has been flagged');
    });

    it('should not throw if comment was previously flagged', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });
      comment.flagMeta = {
        flags: [],
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);

      await service.findOneWithAuthorization(commentId, currentUser);
    });

    it('should return comment if comment is flagged but user is author of comment', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: 'someOtherUserId',
            flaggedAt: new Date(),
          },
        ],
      };
      comment.authorId = currentUser.id;

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);

      service['accessControlService'].checkMessageVisibilityAccess = jest.fn();

      const result = await service.findOneWithAuthorization(
        commentId,
        currentUser
      );

      expect(result).toBe(comment);
    });

    it('should use passed in find options', async () => {
      const commentId = 'commentId';
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake({ authorId: currentUser.id });

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);

      service['accessControlService'].checkMessageVisibilityAccess = jest.fn();

      await service.findOneWithAuthorization(commentId, currentUser, {
        relations: ['author'],
        where: { id: commentId },
      });

      expect(service['repo'].findOne).toHaveBeenCalledWith(commentId, {
        relations: ['post', 'challenge', 'author'],
        where: { id: commentId },
      });
    });
  });

  describe('findByIds', () => {
    it('should return comments in the order that the ids were passed', async () => {
      const comments = Array.from({ length: 5 }, (_, i) =>
        CommentEntityFake({ id: i.toString() })
      );
      const commentIds = comments.map(c => c.id);
      service['repo'].findByIds = jest
        .fn()
        .mockResolvedValue(shuffleArray(comments));
      const result = await service.findByIds(commentIds);
      result.forEach((c, i) => {
        expect(c).toMatchObject(comments[i]);
      });
      expect(service['repo'].findByIds).toHaveBeenCalledWith(commentIds, {
        relations: [],
      });
    });

    it('should use author relation if withAuthor is true', async () => {
      const comments = Array.from({ length: 5 }, (_, i) =>
        CommentEntityFake({ id: i.toString() })
      );
      const commentIds = comments.map(c => c.id);
      service['repo'].findByIds = jest
        .fn()
        .mockResolvedValue(shuffleArray(comments));
      const result = await service.findByIds(commentIds, { withAuthor: true });
      result.forEach((c, i) => {
        expect(c).toMatchObject(comments[i]);
      });
      expect(service['repo'].findByIds).toHaveBeenCalledWith(commentIds, {
        relations: [CommentEntity.kAuthorRelation],
      });
    });
  });

  describe('findByIdWithPostOrFail', () => {
    it('should return the comment if found with post', async () => {
      const commentId = 'commentId';
      const comment = CommentEntityFake({ id: commentId });
      comment.post = PostEntityFake();

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      const result = await service.findByIdWithPostOrFail(commentId);

      expect(result).toBe(comment);
      expect(service['repo'].findByIdWithPost).toHaveBeenCalledWith(commentId);
    });

    it('should throw if comment is not found', async () => {
      const commentId = 'commentId';
      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(undefined);

      expect(service.findByIdWithPostOrFail(commentId)).rejects.toThrowError(
        'Sorry, comment not found'
      );
    });

    it('should throw if post is not found', async () => {
      const commentId = 'commentId';
      const comment = CommentEntityFake({ id: commentId });
      comment.post = undefined;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      expect(service.findByIdWithPostOrFail(commentId)).rejects.toThrowError(
        `Sorry, comment's post not found`
      );
    });
  });

  describe('getReactions', () => {
    it('should return undefined if comment is not found', async () => {
      service['repo'].findOne = jest.fn().mockResolvedValue(undefined);
      const result = await service.getReactions(
        'commentId',
        ReactionType.LIKE,
        {}
      );
      expect(result).toBe(undefined);
    });

    it('should use passed in comment if provided', async () => {
      const comment = CommentEntityFake();
      service['feedService'].find = jest.fn().mockResolvedValue(undefined);
      service['repo'].findOne = jest.fn();
      service['repo'];
      await service.getReactions(comment, ReactionType.LIKE, {});
      expect(service['repo'].findOne).not.toHaveBeenCalled();
    });

    it('should retrieve the like reaction feed if ReactionType is LIKE', async () => {
      const comment = CommentEntityFake();
      service['feedService'].find = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['feedService'].getPage = jest
        .fn()
        .mockResolvedValue([FeedPageFake(), false, true]);
      service['userService'].findAllById = jest.fn().mockResolvedValue([]);
      await service.getReactions(comment, ReactionType.LIKE, {});
      expect(service['feedService'].find).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
      );
    });

    it('should return undefined if the feed is not found', async () => {
      const comment = CommentEntityFake();
      service['feedService'].find = jest.fn().mockResolvedValue(undefined);
      const result = await service.getReactions(comment, ReactionType.LIKE, {});
      expect(result).toBe(undefined);
    });

    it('should return feed page, hasNextPage, hasPreviousPage, and feed count', async () => {
      const comment = CommentEntityFake();
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
        comment,
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

  describe('reactOnComment', () => {
    it('should retrieve the comment with the post', async () => {
      const comment = CommentEntityFake();
      comment.post = PostEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      service.findByIdWithParentOrFail = jest
        .fn()
        .mockResolvedValue({ comment, parent: comment.post });
      service['addLike'] = jest.fn().mockResolvedValue(comment);
      service['accessControlService'].checkMessageReactionAccess = jest.fn();
      await service.reactOnComment({
        commentId: comment.id,
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      expect(service.findByIdWithParentOrFail).toHaveBeenCalledWith(comment.id);
    });

    it('should authorize the reaction', async () => {
      const comment = CommentEntityFake();
      comment.post = PostEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      service.findByIdWithParentOrFail = jest
        .fn()
        .mockResolvedValue({ comment, parent: comment.post });
      service['addLike'] = jest.fn().mockResolvedValue(comment);
      service['accessControlService'].checkMessageReactionAccess = jest.fn();
      await service.reactOnComment({
        commentId: comment.id,
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      expect(
        service['accessControlService'].checkMessageReactionAccess
      ).toHaveBeenCalledWith({
        object: comment.post,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
    });

    it('should call addLike if reactionType is LIKE', async () => {
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      service.findByIdWithParentOrFail = jest
        .fn()
        .mockResolvedValue({ comment, parent });
      service['addLike'] = jest.fn().mockResolvedValue(comment);
      service['accessControlService'].checkMessageReactionAccess = jest
        .fn()
        .mockResolvedValue(currentUser);
      await service.reactOnComment({
        commentId: comment.id,
        reactionType: ReactionType.LIKE,
        currentUser,
        context,
      });
      expect(service['addLike']).toHaveBeenCalledWith({
        comment,
        currentUser,
        parent,
        context,
      });
    });

    it('should call removeLike if reactionType is UN_LIKE', async () => {
      const comment = CommentEntityFake();
      comment.post = PostEntityFake();
      const currentUser = UserEntityFake();
      const context = newAppContext();
      service.findByIdWithParentOrFail = jest
        .fn()
        .mockResolvedValue({ comment, parent: comment.post });
      service.removeLike = jest.fn().mockResolvedValue(comment);
      service['accessControlService'].checkMessageReactionAccess = jest
        .fn()
        .mockResolvedValue(currentUser);
      await service.reactOnComment({
        commentId: comment.id,
        reactionType: ReactionType.UN_LIKE,
        currentUser,
        context,
      });
      expect(service.removeLike).toHaveBeenCalledWith(comment, currentUser);
    });
  });

  describe('addLike', () => {
    it(`it should create the like feed if it does not exist outside the transaction`, async () => {
      const comment = CommentEntityFake();
      const parent = PostEntityFake();
      comment._stats.likeCount = 0;
      const likeFeed = FeedEntityFake({ _count: 0 });
      const context = newAppContext();
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
      service['feedService'].findOrCreateWithId = jest
        .fn()
        .mockResolvedValue(likeFeed);
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: true };
        });
      service['feedService'].createIfNotExists = jest.fn();
      service['notifyAuthorProducer'].reactionOnComment = jest.fn();
      const currentUser = UserEntityFake();
      await service['addLike']({
        comment,
        currentUser,
        parent,
        context,
      });
      expect(service['feedService'].createIfNotExists).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
      );
    });

    it(`should update like feed and stats with additional like`, async () => {
      const comment = CommentEntityFake();
      comment._stats.likeCount = 0;
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
            await fn(txManager);
          },
        },
      };
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: true };
        });
      service['feedService'].createIfNotExists = jest.fn();
      service['notifyAuthorProducer'].reactionOnComment = jest.fn();
      const currentUser = UserEntityFake();
      const result = await service['addLike']({
        comment,
        currentUser,
        context,
        parent,
      });
      expect(result._stats.likeCount).toBe(1);
      expect(feedRepo.findOne).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
      );
      expect(service['feedService'].createIfNotExists).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
      );
      expect(service['feedService'].tryAndPushEntry).toHaveBeenCalledWith(
        likeFeed.id,
        currentUser.id,
        { repo: feedRepo }
      );
      const savedComment = txManager.save.mock.calls[0][0];
      expect(savedComment._stats.likeCount).toBe(1);
    });

    it(`should notify the author and increment interaction count`, async () => {
      const comment = CommentEntityFake();
      comment._stats.likeCount = 0;
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
            await fn(txManager);
          },
        },
      };
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: true };
        });
      service['feedService'].createIfNotExists = jest.fn();
      service['notifyAuthorProducer'].reactionOnComment = jest.fn();
      const currentUser = UserEntityFake();
      await service['addLike']({
        comment,
        currentUser,
        context,
        parent,
      });
      expect(
        service['notifyAuthorProducer'].reactionOnComment
      ).toHaveBeenCalledTimes(1);
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledWith({
        postOrChallenge: parent,
        currentUser,
        objectId: comment.id,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        context,
      });
    });

    it(`should throw and not save comment if the feed update fails`, async () => {
      const comment = CommentEntityFake();
      comment._stats.likeCount = 0;
      const context = newAppContext();
      const parent = PostEntityFake();
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
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockRejectedValue(new Error());
      service['notifyAuthorProducer'].reactionOnComment = jest.fn();
      const currentUser = UserEntityFake();
      await service['addLike']({
        comment,
        currentUser,
        context,
        parent,
      });
      expect(service['feedService'].tryAndPushEntry).toHaveBeenCalledWith(
        likeFeed.id,
        currentUser.id,
        { repo: feedRepo }
      );
      expect(txManager.save).toHaveBeenCalledTimes(0);
      expect(
        service['notifyAuthorProducer'].reactionOnComment
      ).toHaveBeenCalledTimes(0);
    });

    it(`should not notify or increment interactions if user has already liked comment`, async () => {
      const comment = CommentEntityFake();
      comment._stats.likeCount = 1;
      const context = newAppContext();
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
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
      service['feedService'].tryAndPushEntry = jest
        .fn()
        .mockImplementation(async (feedId: string, entry: string) => {
          const feed = _.cloneDeep(likeFeed);
          feed.ids.push(entry);
          feed._count = feed.ids.length;
          return { entity: feed, didAddEntry: false };
        });
      service['notifyAuthorProducer'].reactionOnComment = jest.fn();
      await service['addLike']({ comment, currentUser, context, parent });
      expect(
        service['notifyAuthorProducer'].reactionOnComment
      ).toHaveBeenCalledTimes(0);
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('removeLike', () => {
    it(`should remove the likes from comment like feed`, async () => {
      const userEntity = UserEntityFake();
      const commentEntity = CommentEntityFake();
      commentEntity._stats.likeCount = 1;

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

      const likeFeed = FeedEntityFake({ _count: 2 });
      service['feedService'].find = jest.fn().mockResolvedValue(likeFeed);
      const updatedLikeFeed = FeedEntityFake({ _count: 1 });
      service['feedService'].removeEntry = jest.fn().mockResolvedValue({
        entity: updatedLikeFeed,
        didRemoveEntry: true,
      });

      const result = await service.removeLike(commentEntity, userEntity);

      expect(result._stats.likeCount).toBe(1);

      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, commentEntity.id),
        userEntity.id,
        { repo: feedRepo }
      );

      const savedComment = txManager.save.mock.calls[0][0];
      expect(savedComment._stats.likeCount).toBe(1);
    });

    it(`should throw and not save comment if like removal fails`, async () => {
      const userEntity = UserEntityFake();
      const commentEntity = CommentEntityFake();
      commentEntity._stats.likeCount = 1;

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

      await service.removeLike(commentEntity, userEntity);

      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, commentEntity.id),
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

  describe('flagComment', () => {
    it('should throw if comment does not exist', async () => {
      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(undefined);
      const ctx = {} as AppContext;

      await expect(
        service.flagCommentCommon({
          flagCommentInput: {
            commentId: 'cid',
            operation: FlagOperationType.FLAG,
          },
          ctx,
          parentType: CommentParentType.POST,
        })
      ).rejects.toThrowError('Sorry, comment not found');
    });

    it('should throw if the comment post is not found', async () => {
      const comment = CommentEntityFake();
      comment.post = undefined;
      const ctx = { posts: {} } as AppContext;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      await expect(
        service.flagCommentCommon({
          flagCommentInput: {
            commentId: 'cid',
            operation: FlagOperationType.FLAG,
          },
          ctx,
          parentType: CommentParentType.POST,
        })
      ).rejects.toThrowError(`Sorry, comment's post not found`);
    });

    it('should throw if the currentUser is not the post author', async () => {
      const comment = CommentEntityFake();
      const post = PostEntityFake();
      const currentUser = UserEntityFake({ id: 'otherUserId' });
      post.authorId = 'authorId';
      comment.post = post;
      const ctx = { posts: {} } as AppContext;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      await expect(
        service.flagCommentCommon({
          flagCommentInput: {
            commentId: 'cid',
            operation: FlagOperationType.FLAG,
          },
          ctx,
          parentType: CommentParentType.POST,
          currentUser,
        })
      ).rejects.toThrowError('You can only flag comments on your own post');
    });

    it('should throw if the user is not logged in', async () => {
      const comment = CommentEntityFake();
      const post = PostEntityFake();
      post.authorId = 'authorId';
      comment.post = post;
      const ctx = { posts: {} } as AppContext;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      await expect(
        service.flagCommentCommon({
          flagCommentInput: {
            commentId: 'cid',
            operation: FlagOperationType.FLAG,
          },
          ctx,
          parentType: CommentParentType.POST,
          currentUser: undefined,
        })
      ).rejects.toThrowError('You must be logged in to flag a comment');
    });

    it('it should add the post to the app context and returned comment for use by resolver', async () => {
      const comment = CommentEntityFake();
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.authorId = currentUser.id;
      comment.post = post;
      comment.postId = post.id;
      const ctx = { posts: {} } as AppContext;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const postRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else {
            return postRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };

      const result = await service.flagCommentCommon({
        flagCommentInput: {
          commentId: 'cid',
          operation: FlagOperationType.FLAG,
        },
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });

      expect(result.post).toBe(post);
      if (comment.postId) {
        expect(ctx.posts[comment.postId]).toBe(post);
      }
    });

    it('should add a challenge to app context and returned comment (used by resolver)', async () => {
      const comment = CommentEntityFake();
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      challenge.authorId = currentUser.id;
      comment.challengeId = challenge.id;
      comment.challenge = challenge;
      const ctx = { challenges: {} } as AppContext;

      service['repo'].findByIdWithChallenge = jest
        .fn()
        .mockResolvedValue(comment);

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const challengeRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithChallengeOrFail'] = jest
        .fn()
        .mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else if (entityType === ChallengeEntity) {
            return challengeRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };

      const result = await service.flagCommentCommon({
        flagCommentInput: {
          commentId: 'cid',
          operation: FlagOperationType.FLAG,
        },
        ctx,
        parentType: CommentParentType.CHALLENGE,
        currentUser,
      });

      expect(ctx.challenges[challenge.id]).toBe(challenge);
      expect(result.challenge).toBe(challenge);
    });

    it('should push a flag to the comment if flag operation is FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [],
      };
      const post = PostEntityFake();
      comment.post = post;
      post.authorId = currentUser.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const postRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      const { post: p, ...commentWithoutPost } = comment;
      service['repo'].findOne = jest.fn().mockResolvedValue(commentWithoutPost);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else {
            return postRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };

      const result = await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });

      expect(commentRepo.update.mock.calls[0][1].flagMeta.flags.length).toBe(1);
      expect(commentRepo.update.mock.calls[0][1].flagMeta.flags[0]).toEqual({
        flaggedByUserId: currentUser.id,
        flaggedAt: expect.any(Date),
      });
      expect(result.flagMeta?.flags).toEqual([
        {
          flaggedByUserId: currentUser.id,
          flaggedAt: expect.any(Date),
        },
      ]);
    });

    it('should add entry to flagged comments on post feed when operation is FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [],
      };
      const post = PostEntityFake();
      comment.post = post;
      comment.postId = post.id;
      post.authorId = currentUser.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const postRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else {
            return postRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });

      expect(service['feedService'].tryUnshiftEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, post.id),
        service.getFlaggedCommentEntryId(comment)
      );
    });

    it('should add entry to flagged comments on challenge feed when operation is FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [],
      };
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      comment.challenge = challenge;
      comment.challengeId = challenge.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const ctx = { challenges: {}, comments: {} } as AppContext;

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const challengeRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithChallengeOrFail'] = jest
        .fn()
        .mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else if (entityType === ChallengeEntity) {
            return challengeRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.CHALLENGE,
        currentUser,
      });

      expect(service['feedService'].tryUnshiftEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_CHALLENGE, challenge.id),
        service.getFlaggedCommentEntryId(comment)
      );
    });

    it('should set the hasHiddenComments flag on parent if it is false when operation is FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [],
      };
      const post = PostEntityFake();
      post.stats.hasHiddenComments = false;
      comment.post = post;
      comment.postId = post.id;
      post.authorId = currentUser.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const postRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else {
            return postRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });
      expect(postRepo.createQueryBuilder).toHaveBeenCalled();
      expect(update).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('id = :id', { id: post.id });
      expect(execute).toHaveBeenCalled();
    });

    it('should remove a flag from comment is operation is UN_FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: currentUser.id,
            flaggedAt: new Date(),
          },
          {
            flaggedByUserId: 'otherUserId',
            flaggedAt: new Date(),
          },
        ],
      };
      const post = PostEntityFake();
      post.authorId = currentUser.id;
      comment.post = post;
      comment.postId = post.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.UN_FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      const { post: p, ...commentWithoutPost } = comment;
      service['repo'].findOne = jest.fn().mockResolvedValue(commentWithoutPost);
      service['feedService'].tryRemoveEntry = jest.fn();

      const repo = { update: jest.fn() };
      const txManager = { getRepository: () => repo };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };

      const result = await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });
      expect(repo.update.mock.calls[0][1].flagMeta.flags.length).toBe(1);
      expect(repo.update.mock.calls[0][1].flagMeta.flags[0]).toEqual({
        flaggedByUserId: 'otherUserId',
        flaggedAt: expect.any(Date),
      });
      expect(result.flagMeta?.flags).toEqual([
        {
          flaggedByUserId: 'otherUserId',
          flaggedAt: expect.any(Date),
        },
      ]);
      expect(service['feedService'].tryRemoveEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, post.id),
        service.getFlaggedCommentEntryId(comment)
      );
      expect(result.post).toBe(post);
      expect(ctx.posts[comment.postId]).toBe(comment.post);
    });

    it('should remove entry from flagged comments on post feed if operation is UN_FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: currentUser.id,
            flaggedAt: new Date(),
          },
          {
            flaggedByUserId: 'otherUserId',
            flaggedAt: new Date(),
          },
        ],
      };
      const post = PostEntityFake();
      comment.post = post;
      comment.postId = post.id;
      post.authorId = currentUser.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.UN_FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      service['feedService'].tryRemoveEntry = jest.fn();

      const repo = { update: jest.fn() };
      const txManager = { getRepository: () => repo };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });
      expect(service['feedService'].tryRemoveEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, post.id),
        service.getFlaggedCommentEntryId(comment)
      );
    });

    it('should remove entry from flagged comments on challenge feed if operation is UN_FLAG', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: currentUser.id,
            flaggedAt: new Date(),
          },
          {
            flaggedByUserId: 'otherUserId',
            flaggedAt: new Date(),
          },
        ],
      };
      const challenge = ChallengeEntityFake();
      comment.challenge = challenge;
      comment.challengeId = challenge.id;
      challenge.authorId = currentUser.id;
      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.UN_FLAG,
      };
      const ctx = { comments: {}, challenges: {} } as AppContext;

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithChallengeOrFail'] = jest
        .fn()
        .mockResolvedValue(comment);
      service['feedService'].tryRemoveEntry = jest.fn();

      const repo = { update: jest.fn() };
      const txManager = { getRepository: () => repo };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.CHALLENGE,
        currentUser,
      });
      expect(service['feedService'].tryRemoveEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_CHALLENGE, challenge.id),
        service.getFlaggedCommentEntryId(comment)
      );
    });

    it('should execute comment find with pessimistic_write lock to avoid race conditions', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake();
      post.stats.hasHiddenComments = true;
      post.authorId = currentUser.id;

      const comment = CommentEntityFake();
      comment.flagMeta = {
        flags: [],
      };
      comment.post = post;

      const flagCommentInput = {
        commentId: comment.id,
        operation: FlagOperationType.FLAG,
      };
      const ctx = { posts: {} } as AppContext;

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);

      const repo = { update: jest.fn() };
      const txManager = { getRepository: () => repo };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };
      await service.flagCommentCommon({
        flagCommentInput,
        ctx,
        parentType: CommentParentType.POST,
        currentUser,
      });
      expect(service['repo'].findOne).toHaveBeenCalledWith(
        comment.id,
        { lock: { mode: 'pessimistic_write' } },
        { repo }
      );
    });

    it('should request that the parent post is re-indexed', async () => {
      const comment = CommentEntityFake();
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.authorId = currentUser.id;
      comment.post = post;
      comment.postId = post.id;
      const ctx = { posts: {} } as AppContext;

      service['repo'].findByIdWithPost = jest.fn().mockResolvedValue(comment);

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const postRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['repo'].findOne = jest.fn().mockResolvedValue(comment);
      service['findByIdWithPostOrFail'] = jest.fn().mockResolvedValue(comment);
      service['feedService'].tryUnshiftEntry = jest.fn();

      service.requestReIndex = jest.fn();

      const commentRepo = { update: jest.fn() };
      const txManager = {
        getRepository: (entityType: any) => {
          if (entityType === CommentEntity) {
            return commentRepo;
          } else {
            return postRepo;
          }
        },
      };
      service['repo'].repo = {
        // @ts-expect-error
        manager: {
          transaction: jest.fn().mockImplementation(async fn => {
            return await fn(txManager);
          }),
        },
      };

      await service.flagComment(
        {
          commentId: 'cid',
          operation: FlagOperationType.FLAG,
        },
        ctx,
        currentUser
      );

      expect(service.requestReIndex).toHaveBeenCalledWith(comment.postId);
    });
  });

  describe('filterOutFlaggedComments', () => {
    it('should return empty array if no comments', () => {
      const comments: CommentEntity[] = [];
      const result = service.filterOutFlaggedComments(comments);
      expect(result).toEqual([]);
    });

    it('should return all comments if no comments are flagged', () => {
      const comments = [CommentEntityFake(), CommentEntityFake()];
      const result = service.filterOutFlaggedComments(comments);
      expect(result).toEqual(comments);
    });

    it('should return only non-flagged comments', () => {
      const comments = [
        CommentEntityFake(),
        CommentEntityFake(),
        CommentEntityFake(),
      ];
      comments[0].flagMeta = undefined;
      comments[2].flagMeta = {
        flags: [],
      };
      comments[2].flagMeta = {
        flags: [
          {
            flaggedByUserId: 'uid',
            flaggedAt: new Date(),
          },
        ],
      };
      const result = service.filterOutFlaggedComments(comments);
      expect(result).toHaveLength(2);
    });

    it('should return flagged comments that were created by the user', () => {
      const comments = [CommentEntityFake(), CommentEntityFake()];
      comments[0].flagMeta = {
        flags: [
          {
            flaggedByUserId: 'uid',
            flaggedAt: new Date(),
          },
        ],
      };
      comments[0].authorId = 'uid';
      const result = service.filterOutFlaggedComments(comments, 'uid');
      expect(result).toHaveLength(2);
    });
  });

  describe('getCommentCountForUser', () => {
    it('should return 0 if the comments feed is not found', async () => {
      service['feedService'].find = jest.fn().mockResolvedValue(undefined);

      const result = await service.getCommentCountForUser('postId');

      expect(result).toBe(0);
    });

    it('should return the count of comments in feed if flagged feed is not found', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      feed._count = 3;

      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id === toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, 'postId')
        ) {
          return undefined;
        } else if (id === toFeedId(FeedEntityType.COMMENT, 'postId')) {
          return feed;
        }
        throw new Error('Unexpected feed id');
      });

      const result = await service.getCommentCountForUser('postId');

      expect(result).toBe(3);
    });

    it('should return the count of comments in feed less flagged if no user', async () => {
      const commentsFeed = FeedEntityFake();
      commentsFeed.page.ids = ['1', '2', '3'];
      commentsFeed._count = 3;

      const flaggedFeed = FeedEntityFake();
      flaggedFeed.page.ids = ['1', '2'];
      flaggedFeed._count = 2;

      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id === toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, 'postId')
        ) {
          return flaggedFeed;
        } else if (id === toFeedId(FeedEntityType.COMMENT, 'postId')) {
          return commentsFeed;
        }
        throw new Error('Unexpected feed id');
      });

      const result = await service.getCommentCountForUser('postId');

      expect(result).toBe(1);
    });

    it('should return the count of the comments in the feed less flagged and not created by the user', async () => {
      const currentUser = UserEntityFake();

      const comment = CommentEntityFake();
      comment.authorId = currentUser.id;

      const commentsFeed = FeedEntityFake();
      commentsFeed.page.ids = ['1', '2', '3'];
      commentsFeed._count = 3;

      const flaggedFeed = FeedEntityFake();
      flaggedFeed.page.ids = [service.getFlaggedCommentEntryId(comment), '2'];
      flaggedFeed._count = 2;

      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id === toFeedId(FeedEntityType.FLAGGED_COMMENTS_ON_POST, 'postId')
        ) {
          return flaggedFeed;
        } else if (id === toFeedId(FeedEntityType.COMMENT, 'postId')) {
          return commentsFeed;
        }
        throw new Error('Unexpected feed id');
      });

      const result = await service.getCommentCountForUser(
        'postId',
        CommentParentType.POST,
        currentUser
      );

      expect(result).toBe(2);
    });
  });

  describe('requestReIndex', () => {
    it(`should request incremental index of comment's parent post`, async () => {
      const postId = 'postId';

      service['incrementalIndexStateWorker'].requestIncrementalIndex =
        jest.fn();

      await service.requestReIndex(postId);

      expect(
        service['incrementalIndexStateWorker'].requestIncrementalIndex
      ).toHaveBeenCalledWith({
        entityName: 'PostEntity',
        entityId: postId,
      });
    });
  });

  describe('findByIdWithPostOrFail', () => {
    it('should return comment with challenge', async () => {
      const challenge = ChallengeEntityFake();
      const comment = CommentEntityFake({
        postId: undefined,
        challengeId: challenge.id,
        challenge,
      });
      service['findById'] = jest.fn().mockResolvedValue(comment);
      const result = await service.findByIdWithParentOrFail(comment.id);
      expect(result.comment).toEqual(comment);
      expect(result.parent).toEqual(challenge);
      expect(service['findById']).toHaveBeenCalledWith(comment.id, {
        relations: ['post', 'challenge'],
      });
    });

    it('should return comment with post', async () => {
      const post = PostEntityFake();
      const comment = CommentEntityFake({
        challengeId: undefined,
        postId: post.id,
        post,
      });
      service['findById'] = jest.fn().mockResolvedValue(comment);
      const result = await service.findByIdWithParentOrFail(comment.id);
      expect(result.comment).toEqual(comment);
      expect(result.parent).toEqual(post);
      expect(service['findById']).toHaveBeenCalledWith(comment.id, {
        relations: ['post', 'challenge'],
      });
    });

    it('should throw not found error the comment is not found', async () => {
      service['findById'] = jest.fn().mockResolvedValue(undefined);
      await expect(
        service.findByIdWithParentOrFail('commentId')
      ).rejects.toThrowError(`Sorry, comment not found`);
    });

    it(`should throw not found error if the comment's post wasn't found`, async () => {
      const comment = CommentEntityFake({
        postId: 'postId',
        challengeId: undefined,
        post: undefined,
      });
      service['findById'] = jest.fn().mockResolvedValue(comment);
      await expect(
        service.findByIdWithParentOrFail(comment.id)
      ).rejects.toThrowError(`Sorry, comment's post not found`);
    });

    it(`should throw not found error if the comment's challenge wasn't found`, async () => {
      const comment = CommentEntityFake({
        postId: undefined,
        challengeId: 'challengeId',
        challenge: undefined,
      });
      service['findById'] = jest.fn().mockResolvedValue(comment);
      await expect(
        service.findByIdWithParentOrFail(comment.id)
      ).rejects.toThrowError(`Sorry, comment's challenge not found`);
    });
  });

  describe('notifyUsersMentionedInComment', () => {
    it('should notify users mentioned in comment', async () => {
      const comment = CommentEntityFake();
      comment.content.segments = [
        {
          segment: userSegmentIOFake({ id: 'user1' }),
        },
        {
          segment: userSegmentIOFake({ id: 'user2' }),
        },
        {
          segment: textSegmentIOFake(),
        },
        {
          segment: tagSegmentIOFake(),
        },
      ];
      const result = await service.notifyUsersMentionedInComment({
        commentOrId: comment,
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const resultIds = Array.from(result.value.notifiedUsers);
        expect(resultIds).toEqual(['user1', 'user2']);
      }
      expect(
        service['notifyAboutMentionProducer'].mentionedInComment
      ).toHaveBeenCalledTimes(2);
      expect(
        service['notifyAboutMentionProducer'].mentionedInComment
      ).toHaveBeenCalledWith({
        commentId: comment.id,
        objectId: 'user1',
      });
      expect(
        service['notifyAboutMentionProducer'].mentionedInComment
      ).toHaveBeenCalledWith({
        commentId: comment.id,
        objectId: 'user2',
      });
    });

    it('should not notify the comment author', async () => {
      const comment = CommentEntityFake();
      comment.content.segments = [
        {
          segment: userSegmentIOFake({ id: comment.authorId }),
        },
      ];
      const result = await service.notifyUsersMentionedInComment({
        commentOrId: comment,
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notifyAboutMentionProducer'].mentionedInComment
      ).not.toHaveBeenCalled();
    });

    it('should not send duplicate notifications to users mentioned multiple times', async () => {
      const comment = CommentEntityFake();
      comment.content.segments = [
        {
          segment: userSegmentIOFake({ id: 'user1' }),
        },
        {
          segment: userSegmentIOFake({ id: 'user1' }),
        },
      ];
      const result = await service.notifyUsersMentionedInComment({
        commentOrId: comment,
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notifyAboutMentionProducer'].mentionedInComment
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle unexpected errors', async () => {
      const comment = CommentEntityFake();
      comment.content.segments = [
        {
          segment: userSegmentIOFake({ id: 'user1' }),
        },
      ];
      const error = new Error('Unexpected error');
      service['notifyAboutMentionProducer'].mentionedInComment = jest
        .fn()
        .mockRejectedValue(error);
      const result = await service.notifyUsersMentionedInComment({
        commentOrId: comment,
      });
      expect(result.isErr()).toBe(true);
    });
  });
});
