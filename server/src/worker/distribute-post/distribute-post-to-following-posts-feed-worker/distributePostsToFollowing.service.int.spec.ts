import {
  FeedEntity,
  FeedEntityType,
  FollowingUserPostsFeedBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { PostVisibility } from '@verdzie/server/generated-graphql';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import {
  createMockConnection,
  createMockQueryRunner,
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { DistributePostsToFollowingPostsFeedService } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.service';
import { Connection, Repository } from 'typeorm';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import { PostService } from '@verdzie/server/post/post.service';
import { PostRepository } from '@verdzie/server/post/post-repository/post.repository';
import { ok } from 'neverthrow';
import {
  PostgresQueryFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { PostNotFoundException } from '@verdzie/server/post/post.exceptions';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';

describe(DistributePostsToFollowingPostsFeedService.name, () => {
  let service: DistributePostsToFollowingPostsFeedService;
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    feedRepo = conn.getRepository(FeedEntity);
    postRepo = conn.getRepository(PostEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await postRepo.delete({});
    await userRepo.delete({});
    await feedRepo.delete({});
  };

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        DistributePostsToFollowingPostsFeedService,
        FeedService,
        PostService,
        PostRepository,
        {
          provide: getConnectionToken(),
          useValue: conn,
        },
        {
          provide: getRepositoryToken(PostEntity),
          useValue: postRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(FeedEntity),
          useValue: feedRepo,
        },
      ],
    });
    service = module.get(DistributePostsToFollowingPostsFeedService);
    // @ts-ignore
    service['canNotifyFollowers'] = true;
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
  });

  describe(
    DistributePostsToFollowingPostsFeedService.prototype
      .distributePostToFollowingPostsFeed.name,
    () => {
      it('should add post to new following posts feeds', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        const follower2 = UserEntityFake();
        await userRepo.insert([author, follower1, follower2]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id, follower2.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id, follower2.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        const feeds = await feedRepo.findByIds([
          toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
          toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower2.id),
        ]);
        expect(feeds).toHaveLength(2);
        expect(feeds[0].page.ids).toEqual([post.id]);
        expect(feeds[0].count).toEqual(1);
        expect(feeds[1].page.ids).toEqual([post.id]);
        expect(feeds[1].count).toEqual(1);
      });

      it('should add post to existing followers feeds', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        const follower1FollowingPostsFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
          page: FeedPageFake({
            ids: ['postId'],
          }),
        });
        await feedRepo.insert([
          authorFollowerFeed,
          follower1FollowingPostsFeed,
        ]);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        const feeds = await feedRepo.findByIds([
          toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
        ]);
        expect(feeds).toHaveLength(1);
        expect(feeds[0].page.ids).toEqual([post.id, 'postId']);
        expect(feeds[0].count).toEqual(2);
      });

      it('should add post to post type specific feeds', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        const follower1FollowingPostsFeed = FeedEntityFake({
          id: toFeedId(
            FollowingUserPostsFeedBasedOnPostTypes[post.type],
            follower1.id
          ),
          page: FeedPageFake({
            ids: ['postId'],
          }),
        });
        await feedRepo.insert([
          authorFollowerFeed,
          follower1FollowingPostsFeed,
        ]);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        const feeds = await feedRepo.findByIds([
          toFeedId(
            FollowingUserPostsFeedBasedOnPostTypes[post.type],
            follower1.id
          ),
        ]);
        expect(feeds).toHaveLength(1);
        expect(feeds[0].page.ids).toEqual([post.id, 'postId']);
        expect(feeds[0].count).toEqual(2);
      });

      it('should not allow duplicate posts in feeds', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        const follower1FollowingPostsFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
          page: FeedPageFake({
            ids: [post.id],
          }),
        });
        await feedRepo.insert([
          authorFollowerFeed,
          follower1FollowingPostsFeed,
        ]);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        const feeds = await feedRepo.findByIds([
          toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
        ]);
        expect(feeds).toHaveLength(1);
        expect(feeds[0].page.ids).toEqual([post.id]);
        expect(feeds[0].count).toEqual(1);
      });

      it('should remove existing duplicates from feeds if they exist', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        const follower1FollowingPostsFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
          page: FeedPageFake({
            ids: ['postId', 'postId'],
          }),
        });
        await feedRepo.insert([
          authorFollowerFeed,
          follower1FollowingPostsFeed,
        ]);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        const feeds = await feedRepo.findByIds([
          toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
        ]);
        expect(feeds).toHaveLength(1);
        expect(feeds[0].page.ids).toEqual([post.id, 'postId']);
        expect(feeds[0].count).toEqual(2);
      });

      it('should send a notification to followers if requested', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        service['notifyFollowersAboutPostWorker'].notifyFollowersAboutPosts =
          jest.fn().mockResolvedValue(ok(true));
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: true,
        });
        expect(result.isOk()).toBe(true);
        expect(
          service['notifyFollowersAboutPostWorker'].notifyFollowersAboutPosts
        ).toBeCalledWith({
          followerIds: [follower1.id],
          postId: post.id,
        });
      });

      it('should return errors when feed lookup fails', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        const fakeFeedRepo = createMockRepo({});
        fakeFeedRepo.findByIds = jest.fn().mockRejectedValue(new Error('test'));
        const queryRunner = createMockQueryRunner({
          repositories: {
            FeedEntity: fakeFeedRepo,
          },
        });
        const connection = createMockConnection({});
        connection.createQueryRunner = jest.fn().mockReturnValue(queryRunner);
        // @ts-ignore
        service['connection'] = connection;
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          PostgresQueryFailedException
        );
      });

      it('should return errors when feed update fails', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        const fakeFeedRepo = createMockRepo({});
        fakeFeedRepo.findByIds = jest
          .fn()
          .mockResolvedValue([FeedEntityFake({})]);
        fakeFeedRepo.update = jest.fn().mockRejectedValue(new Error('test'));
        const queryRunner = createMockQueryRunner({
          repositories: {
            FeedEntity: fakeFeedRepo,
          },
        });
        const connection = createMockConnection({});
        connection.createQueryRunner = jest.fn().mockReturnValue(queryRunner);
        // @ts-ignore
        service['connection'] = connection;
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          PostgresUpdateFailedException
        );
      });

      it('should return errors when post lookup fails', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        // @ts-ignore
        service['postService'].findById = jest
          .fn()
          .mockRejectedValue(new Error('test'));
        const result = await service.distributePostToFollowingPostsFeed({
          postId: 'postId',
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          PostgresQueryFailedException
        );
      });

      it('should return not found exception when post is not found', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        const result = await service.distributePostToFollowingPostsFeed({
          postId: 'postId',
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(PostNotFoundException);
      });

      it('should handle errors from notifyFollowersAboutPosts', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        service['notifyFollowersAboutPostWorker'].notifyFollowersAboutPosts =
          jest.fn().mockRejectedValue(new Error('test'));
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: true,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          JobProductionException
        );
      });

      it('should not notify followers if not requested', async () => {
        const author = UserEntityFake();
        const follower1 = UserEntityFake();
        await userRepo.insert([author, follower1]);
        const post = PostEntityFake({ authorId: author.id });
        await postRepo.insert(post);
        const authorFollowerFeed = FeedEntityFake({
          id: toFeedId(FeedEntityType.FOLLOWER, author.id),
          page: FeedPageFake({
            ids: [follower1.id],
          }),
        });
        await feedRepo.insert(authorFollowerFeed);
        service['notifyFollowersAboutPostWorker'].notifyFollowersAboutPosts =
          jest.fn().mockResolvedValue(ok(true));
        const result = await service.distributePostToFollowingPostsFeed({
          postId: post.id,
          postVisibility: PostVisibility.ALL,
          userIds: [follower1.id],
          shouldNotifyFollowers: false,
        });
        expect(result.isOk()).toBe(true);
        expect(
          service['notifyFollowersAboutPostWorker'].notifyFollowersAboutPosts
        ).not.toBeCalled();
      });
    }
  );
});
