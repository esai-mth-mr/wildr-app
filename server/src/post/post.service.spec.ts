import { TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  BlockOperationType,
  ParticipationType,
  ReactionType,
} from '@verdzie/server/generated-graphql';
import { PostEntity } from './post.entity';
import { UserEntityFake } from '../user/testing/user-entity.fake';
import { FeedEntityFake } from '../feed/testing/feed-entity.fake';
import { toFeedId } from '../feed/feed.service';
import { PostEntityFake } from './testing/post.fake';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { ChallengeInteractionEnum } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { AppContext, newAppContext } from '@verdzie/server/common';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@verdzie/server/exceptions/wildr.exception';

describe('PostService', () => {
  let service: PostService;
  let module: TestingModule;

  describe('findAllNonExpired', () => {
    beforeAll(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('should preserve the order by input ids', async () => {
      const fakePosts = [
        PostEntityFake({ id: '1' }),
        PostEntityFake({ id: '2' }),
        PostEntityFake({ id: '3' }),
      ];

      service['repo'].findByIds = () => Promise.resolve(fakePosts);

      service = module.get(PostService);

      const ids = ['3', '2', '1'];
      const posts = await service.findAllNonExpired(ids, []);

      ids.forEach((id, i) => {
        expect(posts[i].id).toEqual(id);
      });
    });
  });

  describe('getStatsForUser', () => {
    let service: PostService;

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('should return base stats when hasHiddenComments is false', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({
        // @ts-ignore
        likeReactionFeed: { count: 10 },
        // @ts-ignore
        realReactionFeed: { count: 5 },
        // @ts-ignore
        applaudReactionFeed: { count: 15 },
        stats: {
          likeCount: 10,
          realCount: 5,
          applauseCount: 15,
          shareCount: 2,
          repostCount: 3,
          commentCount: 8,
          reportCount: 1,
          hasHiddenComments: false,
        },
      });

      const expectedStats = {
        likeCount: 10,
        realCount: 5,
        applauseCount: 15,
        shareCount: 2,
        repostCount: 3,
        commentCount: 8,
        reportCount: 1,
        hasHiddenComments: false,
      };

      const result = await service.getStatsForUser(post, currentUser);
      expect(result).toEqual(expectedStats);
    });

    it('should return stats with updated comment count when hasHiddenComments is true', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({
        likeReactionFeed: undefined,
        realReactionFeed: undefined,
        applaudReactionFeed: undefined,
        stats: {
          likeCount: 10,
          realCount: 5,
          applauseCount: 15,
          shareCount: 2,
          repostCount: 3,
          commentCount: 8,
          reportCount: 1,
          hasHiddenComments: true,
        },
      });
      const updatedCommentCount = 3;

      service['getCommentCountForUser'] = jest
        .fn()
        .mockResolvedValue(updatedCommentCount);

      const expectedStats = {
        likeCount: 10,
        realCount: 5,
        applauseCount: 15,
        shareCount: 2,
        repostCount: 3,
        commentCount: updatedCommentCount,
        reportCount: 1,
        hasHiddenComments: true,
      };

      const result = await service.getStatsForUser(post, currentUser);
      expect(result).toEqual(expectedStats);
      expect(service.getCommentCountForUser).toHaveBeenCalledWith(
        post.id,
        currentUser
      );
    });
  });

  describe('getFeedType', () => {
    let service: PostService;

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('returns REAL_REACTIONS_ON_POST for REAL', () => {
      const feedType = service.getFeedType(ReactionType.REAL);
      expect(feedType).toEqual(FeedEntityType.REAL_REACTIONS_ON_POST);
    });

    it('returns REAL_REACTIONS_ON_POST for UN_REAL', () => {
      const feedType = service.getFeedType(ReactionType.UN_REAL);
      expect(feedType).toEqual(FeedEntityType.REAL_REACTIONS_ON_POST);
    });

    it('returns APPLAUD_REACTIONS_ON_POST for APPLAUD', () => {
      const feedType = service.getFeedType(ReactionType.APPLAUD);
      expect(feedType).toEqual(FeedEntityType.APPLAUD_REACTIONS_ON_POST);
    });

    it('returns APPLAUD_REACTIONS_ON_POST for UN_APPLAUD', () => {
      const feedType = service.getFeedType(ReactionType.UN_APPLAUD);
      expect(feedType).toEqual(FeedEntityType.APPLAUD_REACTIONS_ON_POST);
    });

    it('returns LIKE_REACTIONS_ON_POST for LIKE', () => {
      const feedType = service.getFeedType(ReactionType.LIKE);
      expect(feedType).toEqual(FeedEntityType.LIKE_REACTIONS_ON_POST);
    });

    it('returns LIKE_REACTIONS_ON_POST for UN_LIKE', () => {
      const feedType = service.getFeedType(ReactionType.UN_LIKE);
      expect(feedType).toEqual(FeedEntityType.LIKE_REACTIONS_ON_POST);
    });

    it('throws error for unknown reaction type', () => {
      expect(() => {
        service.getFeedType('unknown' as ReactionType);
      }).toThrowError('Invalid reaction type');
    });
  });

  describe('getReactionFeedIdPropertyName', () => {
    const post = new PostEntity();

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('sets the correct property for REAL', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.realReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.REAL)]
      ).toBe(id);
    });

    it('sets the correct property for UN_REAL', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.realReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.UN_REAL)]
      ).toBe(id);
    });

    it('sets the correct property for APPLAUD', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.applaudReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.APPLAUD)]
      ).toBe(id);
    });

    it('sets the correct property for UN_APPLAUD', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.applaudReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.UN_APPLAUD)]
      ).toBe(id);
    });

    it('sets the correct property for LIKE', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.likeReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.LIKE)]
      ).toBe(id);
    });

    it('sets the correct property for UN_LIKE', () => {
      const id = Math.floor(Math.random() * 1000).toString();
      post.likeReactionFeedId = id;
      expect(
        post[service.getReactionFeedIdPropertyName(ReactionType.UN_LIKE)]
      ).toBe(id);
    });
  });

  describe('getReactionFeedPropertyName', () => {
    let service: PostService;
    const post = new PostEntity();

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('gets the correct property name for real', () => {
      const feed = new FeedEntity();
      post.realReactionFeed = feed;
      expect(post[service.getReactionFeedPropertyName(ReactionType.REAL)]).toBe(
        feed
      );
    });

    it('gets the correct property name for un_real', () => {
      const feed = new FeedEntity();
      post.realReactionFeed = feed;
      expect(
        post[service.getReactionFeedPropertyName(ReactionType.UN_REAL)]
      ).toBe(feed);
    });

    it('gets the correct property name for applaud', () => {
      const feed = new FeedEntity();
      post.applaudReactionFeed = feed;
      expect(
        post[service.getReactionFeedPropertyName(ReactionType.APPLAUD)]
      ).toBe(feed);
    });

    it('gets the correct property name for un_applaud', () => {
      const feed = new FeedEntity();
      post.applaudReactionFeed = feed;
      expect(
        post[service.getReactionFeedPropertyName(ReactionType.UN_APPLAUD)]
      ).toBe(feed);
    });

    it('gets the correct property name for like', () => {
      const feed = new FeedEntity();
      post.likeReactionFeed = feed;
      expect(post[service.getReactionFeedPropertyName(ReactionType.LIKE)]).toBe(
        feed
      );
    });

    it('gets the correct property name for un_like', () => {
      const feed = new FeedEntity();
      post.likeReactionFeed = feed;
      expect(
        post[service.getReactionFeedPropertyName(ReactionType.UN_LIKE)]
      ).toBe(feed);
    });
  });

  describe('getReactionStatPropertyName', () => {
    let service: PostService;
    const post = new PostEntity();

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('gets the correct property name for REAL', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.REAL, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.REAL)]
      ).toBe(count);
    });

    it('gets the correct property name for UN_REAL', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.UN_REAL, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.UN_REAL)]
      ).toBe(count);
    });

    it('gets the correct property name for APPLAUD', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.APPLAUD, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.APPLAUD)]
      ).toBe(count);
    });

    it('gets the correct property name for UN_APPLAUD', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.UN_APPLAUD, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.UN_APPLAUD)]
      ).toBe(count);
    });

    it('gets the correct property name for LIKE', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.LIKE, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.LIKE)]
      ).toBe(count);
    });

    it('gets the correct property name for UN_LIKE', () => {
      const count = Math.floor(Math.random() * 100);
      post.setReactionCount(ReactionType.UN_LIKE, count);
      expect(
        post.stats[service.getReactionStatPropertyName(ReactionType.UN_LIKE)]
      ).toBe(count);
    });

    it('throws error for unknown reaction type', () => {
      expect(() => {
        service.getReactionStatPropertyName('unknown' as ReactionType);
      }).toThrowError('Invalid reaction type');
    });
  });

  describe('addReaction', () => {
    let service: PostService;

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('should unshift userId entries to the post reaction feed', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockResolvedValue(reactionFeed);

      await service['addReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed,
        newAppContext()
      );

      // @ts-expect-error
      const firstCall = service['feedService'].tryUnshiftEntry.mock.calls[0];

      expect(firstCall[0]).toBe(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_POST, post.id)
      );
      expect(firstCall[1]).toBe(currentUser.id);
    });

    it('should unshift post id entries to the reactors reaction feed', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      // Mock tryUnshiftEntry to return the reaction feed
      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockResolvedValue(reactionFeed);

      await service['addReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed,
        newAppContext()
      );

      // @ts-expect-error
      const secondCall = service['feedService'].tryUnshiftEntry.mock.calls[1];

      expect(secondCall[0]).toBe(reactorsReactionFeed);
      expect(secondCall[1]).toBe(post.id);
    });

    it('should add the reaction count, reactionFeed and reactionFeedId to the post', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      // Mock tryUnshiftEntry to return the reaction feed
      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockImplementation(() => {
          reactionFeed._count = 5;
          reactionFeed.id = 'new_reaction_feed_id';
          return reactionFeed;
        });

      const modifiedPost = await service['addReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed,
        newAppContext()
      );

      expect(modifiedPost.stats.likeCount).toBe(5);
      expect(modifiedPost.likeReactionFeedId).toBe(reactionFeed.id);
    });

    it('should perform an idempotent update to the post stats', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockImplementation(() => {
          reactionFeed._count = 5;
          reactionFeed.id = 'new_reaction_feed_id';
          return reactionFeed;
        });

      await service['addReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed,
        newAppContext()
      );

      expect(update).toHaveBeenCalledWith(PostEntity);
      expect(set).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('id = :id', { id: post.id });
      expect(execute).toHaveBeenCalled();
    });

    it('should update challenge authors interactions', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();
      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };
      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockImplementation(() => {
          reactionFeed._count = 5;
          reactionFeed.id = 'new_reaction_feed_id';
          return reactionFeed;
        });
      const context = newAppContext();
      await service['addReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed,
        context
      );
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledWith({
        postOrChallenge: post,
        currentUser,
        objectId: post.id,
        interactionType: ChallengeInteractionEnum.REACTED_TO_ENTRY,
        context,
      });
    });
  });

  describe('removeReaction', () => {
    let service: PostService;

    beforeEach(async () => {
      module = await createMockedTestingModule({ providers: [PostService] });
      service = module.get(PostService);
    });

    it('should remove entries from the post reaction feed', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryRemoveEntry = jest
        .fn()
        .mockResolvedValue(reactionFeed);

      await service['removeReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed
      );

      // @ts-expect-error
      const firstCall = service['feedService'].tryRemoveEntry.mock.calls[0];

      expect(firstCall[0]).toBe(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_POST, post.id)
      );
      expect(firstCall[1]).toBe(currentUser.id);
    });

    it('should remove post id entries from reactors reaction feed', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryRemoveEntry = jest
        .fn()
        .mockResolvedValue(reactionFeed);

      await service['removeReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed
      );

      // @ts-expect-error
      const secondCall = service['feedService'].tryRemoveEntry.mock.calls[1];

      expect(secondCall[0]).toBe(reactorsReactionFeed);
      expect(secondCall[1]).toBe(post.id);
    });

    it('should add the reaction count, reactionFeed and reactionFeedId to the post', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryRemoveEntry = jest
        .fn()
        .mockImplementation(() => {
          reactionFeed._count = 0;
          reactionFeed.id = 'new_reaction_feed_id';
          return reactionFeed;
        });

      const modifiedPost = await service['removeReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed
      );

      expect(modifiedPost.stats.likeCount).toBe(0);
      expect(modifiedPost.likeReactionFeedId).toBe(reactionFeed.id);
    });

    it('should perform an idempotent update to the post stats', async () => {
      const post = PostEntityFake({});
      const currentUser = UserEntityFake();
      const reactorsReactionFeed = FeedEntityFake();
      const reactionFeed = FeedEntityFake();

      const execute = jest.fn();
      const where = jest.fn().mockReturnValue({ execute });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      // @ts-expect-error
      service['repo']['repository'] = {
        createQueryBuilder: jest.fn().mockReturnValue({ update }),
      };

      service['feedService'].tryRemoveEntry = jest
        .fn()
        .mockImplementation(() => {
          reactionFeed._count = 5;
          reactionFeed.id = 'new_reaction_feed_id';
          return reactionFeed;
        });

      await service['removeReaction'](
        ReactionType.LIKE,
        post,
        currentUser,
        reactorsReactionFeed
      );

      expect(update).toHaveBeenCalledWith(PostEntity);
      expect(set).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('id = :id', { id: post.id });
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('blockCommenterOnPost', () => {
    it('should throw if hte user is not logged in', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = undefined;

      await expect(
        service.blockCommenterOnPost(
          postId,
          commenterId,
          blockOperationType,
          currentUser
        )
      ).rejects.toThrowError('You must be logged in to block users');
    });

    it('should throw if the user is trying to block themselves', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = UserEntityFake({ id: commenterId });

      await expect(
        service.blockCommenterOnPost(
          postId,
          commenterId,
          blockOperationType,
          currentUser
        )
      ).rejects.toThrowError('You cannot block yourself');
    });

    it('should throw if the post is not found', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = UserEntityFake({ id: 'currentUserId' });

      service['repo'].findById = jest.fn().mockResolvedValue(undefined);

      await expect(
        service.blockCommenterOnPost(
          postId,
          commenterId,
          blockOperationType,
          currentUser
        )
      ).rejects.toThrowError('Post not found');
    });

    it('should throw if the user is not the post author', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = UserEntityFake({ id: 'currentUserId' });
      const post = PostEntityFake({ authorId: 'otherUserId' });

      service['repo'].findById = jest.fn().mockResolvedValue(post);

      await expect(
        service.blockCommenterOnPost(
          postId,
          commenterId,
          blockOperationType,
          currentUser
        )
      ).rejects.toThrowError(
        `Only the post author can block users from commenting`
      );
    });

    it('should remove the user from the blocked from commenting feed if operation is unblock', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.UN_BLOCK;
      const currentUser = UserEntityFake({ id: 'currentUserId' });
      const post = PostEntityFake({ authorId: currentUser.id });

      service['repo'].findById = jest.fn().mockResolvedValue(post);
      service['feedService'].tryRemoveEntry = jest.fn();

      await service.blockCommenterOnPost(
        postId,
        commenterId,
        blockOperationType,
        currentUser
      );

      expect(service['feedService'].tryRemoveEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, postId),
        commenterId
      );
    });

    it('should add the user to the blocked from commenting feed if operation is block', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = UserEntityFake({ id: 'currentUserId' });
      const post = PostEntityFake({ authorId: currentUser.id });

      service['repo'].findById = jest.fn().mockResolvedValue(post);
      service['feedService'].tryUnshiftEntry = jest.fn();

      await service.blockCommenterOnPost(
        postId,
        commenterId,
        blockOperationType,
        currentUser
      );

      expect(service['feedService'].tryUnshiftEntry).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, postId),
        commenterId
      );
    });

    it('should throw if the block operation type is not implemented', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = 'notImplemented' as BlockOperationType;
      const currentUser = UserEntityFake({ id: 'currentUserId' });
      const post = PostEntityFake({ authorId: currentUser.id });

      service['repo'].findById = jest.fn().mockResolvedValue(post);

      await expect(
        service.blockCommenterOnPost(
          postId,
          commenterId,
          blockOperationType,
          currentUser
        )
      ).rejects.toThrowError(`Block operation type not implemented`);
    });

    it('should return the input args if the task succeeds', async () => {
      const postId = 'postId';
      const commenterId = 'commenterId';
      const blockOperationType = BlockOperationType.BLOCK;
      const currentUser = UserEntityFake({ id: 'currentUserId' });
      const post = PostEntityFake({ authorId: currentUser.id });

      service['repo'].findById = jest.fn().mockResolvedValue(post);
      service['feedService'].tryUnshiftEntry = jest.fn();

      const result = await service.blockCommenterOnPost(
        postId,
        commenterId,
        blockOperationType,
        currentUser
      );

      expect(result).toEqual({
        postId,
        commenterId,
        blockOperationType,
      });
    });
  });

  describe('userIsBlockedFromCommenting', () => {
    it('should return true if the user is in the blocked from commenting feed', async () => {
      const postId = 'postId';
      const userId = 'userId';
      const feed = FeedEntityFake();
      feed.page.ids = [userId];

      service['feedService'].find = jest.fn().mockResolvedValue(feed);

      const result = await service.userIsBlockedFromCommenting(postId, userId);

      expect(result).toBe(true);
    });

    it('should return false if the user is not in the blocked from commenting feed', async () => {
      const postId = 'postId';
      const userId = 'userId';
      const feed = FeedEntityFake();
      feed.page.ids = ['otherUserId'];

      service['feedService'].find = jest.fn().mockResolvedValue(feed);

      const result = await service.userIsBlockedFromCommenting(postId, userId);

      expect(result).toBe(false);
    });

    it('should return false if the feed is not found', async () => {
      const postId = 'postId';
      const userId = 'userId';

      service['feedService'].find = jest.fn().mockResolvedValue(undefined);

      const result = await service.userIsBlockedFromCommenting(postId, userId);

      expect(result).toBe(false);
    });
  });

  describe('requestReIndex', () => {
    it('should request incremental re-indexing of the post', async () => {
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

  describe('addComment', () => {
    it('should call updateChallengeInteractionsIfAuthor', async () => {
      const postAuthor = UserEntityFake();
      const post = PostEntityFake({ author: postAuthor });
      const currentUser = UserEntityFake();
      const createdComment = CommentEntityFake();
      const context = newAppContext();
      service['repo'].findById = jest.fn().mockResolvedValueOnce(post);
      service['repo'].update = jest.fn();
      service['userService'].isSuspended = jest.fn().mockReturnValue(false);
      service['userService'].hasBlocked = jest.fn().mockResolvedValue(false);
      service['feedService'].find = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['commentService'].addComment = jest
        .fn()
        .mockResolvedValue(createdComment);
      service['findMentionedUsersInCommentAndNotifyThem'] = jest.fn();
      await service.addComment(
        currentUser,
        {
          postId: post.id,
          content: {},
          participationType: ParticipationType.OPEN,
        },
        context
      );
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledWith({
        postOrChallenge: post,
        currentUser,
        objectId: createdComment.id,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        context,
      });
    });

    it('should add the created comment to the app context', async () => {
      const postAuthor = UserEntityFake();
      const post = PostEntityFake({ author: postAuthor });
      const currentUser = UserEntityFake();
      const createdComment = CommentEntityFake();
      service['repo'].findById = jest.fn().mockResolvedValueOnce(post);
      service['repo'].update = jest.fn();
      service['userService'].isSuspended = jest.fn().mockReturnValue(false);
      service['userService'].hasBlocked = jest.fn().mockResolvedValue(false);
      service['feedService'].find = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['feedService'].tryUnshiftEntry = jest
        .fn()
        .mockResolvedValue(FeedEntityFake());
      service['commentService'].addComment = jest
        .fn()
        .mockResolvedValue(createdComment);
      service['findMentionedUsersInCommentAndNotifyThem'] = jest.fn();
      const ctx = {
        posts: {},
        comments: {},
      } as AppContext;
      await service.addComment(
        currentUser,
        {
          postId: post.id,
          content: {},
          participationType: ParticipationType.OPEN,
        },
        ctx
      );
      expect(ctx.comments[createdComment.id]).toEqual(createdComment);
    });
  });

  describe('pinComment', () => {
    it('should return a not found error if the post is not found', async () => {
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(undefined);
      const result = await service.pinComment({
        postId: 'postId',
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should return a not found error if the comment is not found', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest
        .fn()
        .mockResolvedValue(undefined);
      const result = await service.pinComment({
        postId: post.id,
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should return a unauthorized error if the user is not the author of the post', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: 'otherUserId' });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      const result = await service.pinComment({
        postId: post.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('should return a bad request exception if the comment is not related to the post', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: 'otherPostId',
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      const result = await service.pinComment({
        postId: post.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should update the posts pinned comment', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service['repo'].save = jest.fn();
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      await service.pinComment({
        postId: post.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(service['repo'].update).toHaveBeenCalledWith(post.id, {
        pinnedCommentId: comment.id,
      });
    });

    it('should return a post and pinned comment', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service['repo'].update = jest.fn();
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      const result = await service.pinComment({
        postId: post.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value.post).toEqual(post);
        expect(result.value.pinnedComment).toEqual(comment);
        expect(result.value.post.pinnedComment).toEqual(comment);
      }
    });

    it('should update a challenge authors interactions', async () => {
      const currentUser = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      const context = newAppContext();
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      await service.pinComment({
        postId: post.id,
        commentId: comment.id,
        currentUser,
        context,
      });
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledWith({
        postOrChallenge: post,
        currentUser,
        objectId: comment.id,
        interactionType: ChallengeInteractionEnum.PINNED_COMMENT,
        context,
      });
    });
  });

  describe('unPinComment', () => {
    it('should return a not found error if the post is not found', async () => {
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.repo.findById = jest.fn().mockResolvedValue(undefined);
      const result = await service.unPinComment({
        postId: 'postId',
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
      expect(service.repo.findById).toHaveBeenCalledWith('postId');
    });

    it('should return an UnauthorizedException if the user is not the author of the post', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: 'otherUserId' });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.repo.findById = jest.fn().mockResolvedValue(post);
      const result = await service.unPinComment({
        postId: post.id,
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('should remove the posts pinned comment', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.repo.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service['repo'].update = jest.fn();
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      await service.unPinComment({
        postId: post.id,
        currentUser,
      });
      expect(service['repo'].update).toHaveBeenCalledWith(post.id, {
        pinnedCommentId: undefined,
      });
    });

    it('should remove the posts pinned comment from the posts comment', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      post.pinnedComment = comment;
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.repo.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service['repo'].update = jest.fn();
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      const result = await service.unPinComment({
        postId: post.id,
        currentUser,
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value.pinnedComment).toBeUndefined();
      }
    });

    it('should handle unexpected errors', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake({ authorId: currentUser.id });
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [PostService],
        })
      ).get(PostService);
      service.repo.findById = jest.fn().mockResolvedValue(post);
      service['commentService'].findById = jest.fn().mockResolvedValue(comment);
      service['repo'].update = jest.fn().mockRejectedValue(new Error());
      service[
        'challengeInteractionService'
      ].updateChallengeInteractionsIfAuthor = jest.fn();
      const result = await service.unPinComment({
        postId: post.id,
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
