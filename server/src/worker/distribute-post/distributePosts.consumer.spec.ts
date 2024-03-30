import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { PostVisibility } from '@verdzie/server/generated-graphql';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { postAccessControlFake } from '@verdzie/server/post/testing/postAccessControl.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import {
  UserPropertyMapEntityFake,
  UserPropertyMapEntityFakeWithoutUsers,
} from '@verdzie/server/user-property-map/testing/userPropertyMapEntity.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { DistributePostInBatchesJob } from '@verdzie/server/worker/distribute-post/distributePosts.producer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { Job } from 'bull';
import { DistributePostsConsumer } from './distributePosts.consumer';

function DistributePostInBatchesJobFake(
  overrides: Partial<DistributePostInBatchesJob> = {}
) {
  return JobFake({
    data: {
      postId: 'postid',
      postVisibility: PostVisibility.ALL,
      onlyNotify: false,
      shouldNotify: false,
      userIdsToSkip: [],
      accessControl: postAccessControlFake(),
    },
    ...overrides,
  }) as Job<DistributePostInBatchesJob>;
}

describe('DistributePostsConsumer', () => {
  let consumer: DistributePostsConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [DistributePostsConsumer],
    });
    consumer = module.get(DistributePostsConsumer);
  });

  describe('distributePosts', () => {
    it('should return if post cannot be found', async () => {
      const job = DistributePostInBatchesJobFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(undefined);
      await consumer.distributePosts(job);
      expect(consumer['userService'].findById).not.toHaveBeenCalled();
      expect(consumer['postService'].findById).toHaveBeenCalledWith(
        job.data.postId
      );
    });

    it('should return if the post author cannot be found', async () => {
      const job = DistributePostInBatchesJobFake();
      const post = PostEntityFake();
      post.author = undefined;
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      consumer['userService'].findById = jest.fn().mockResolvedValue(undefined);
      await consumer.distributePosts(job);
      expect(
        consumer['userPropMapService'].findAllByOwnerId
      ).not.toHaveBeenCalled();
      expect(consumer['userService'].findById).toHaveBeenCalledWith(
        post.authorId
      );
    });

    it('should return if user property entity map contains no users', async () => {
      const job = DistributePostInBatchesJobFake();
      const post = PostEntityFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue(UserPropertyMapEntityFakeWithoutUsers());
      await consumer.distributePosts(job);
      expect(
        consumer['userPropMapService'].findAllByOwnerId
      ).toHaveBeenCalledWith(post.author.id);
      // TODO check it hasn't gone past this point
    });

    it('should distribute to followers if the post access is set to followers', async () => {
      const job = DistributePostInBatchesJobFake();
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.FOLLOWERS;
      job.data.shouldNotify = true;
      const post = PostEntityFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      const followerFeedPage = FeedEntityFake();
      followerFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', ['followerFeedId']);
      userPropMapEntitiesPage.setOrAppendProperty('user2', ['followerFeedId']);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue([followerFeedPage]);
      consumer[
        'distributePostsToFollowersWorker'
      ].distributePostsToFollowingPostsFeed = jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockReturnValue(true);
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostsToFollowersWorker']
          .distributePostsToFollowingPostsFeed;
      // @ts-ignore
      const calls = distFunc.mock.calls;
      expect(calls[0][0]).toStrictEqual({
        userIds: [post.author.id],
        shouldNotifyFollowers: true,
        ...job.data,
      });
      expect(calls[1][0]).toStrictEqual({
        userIds: ['user1', 'user2'],
        shouldNotifyFollowers: true,
        ...job.data,
      });
    });

    it('should distribute to followers if the post access is set to everyone', async () => {
      const job = DistributePostInBatchesJobFake();
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.EVERYONE;
      job.data.shouldNotify = true;
      const post = PostEntityFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      const followerFeedPage = FeedEntityFake();
      followerFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', ['followerFeedId']);
      userPropMapEntitiesPage.setOrAppendProperty('user2', ['followerFeedId']);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue([followerFeedPage]);
      consumer[
        'distributePostsToFollowersWorker'
      ].distributePostsToFollowingPostsFeed = jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockReturnValue(true);
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostsToFollowersWorker']
          .distributePostsToFollowingPostsFeed;
      // @ts-ignore
      const calls = distFunc.mock.calls;
      expect(calls[0][0]).toStrictEqual({
        userIds: [post.author.id],
        shouldNotifyFollowers: true,
        ...job.data,
      });
      expect(calls[1][0]).toStrictEqual({
        userIds: ['user1', 'user2'],
        shouldNotifyFollowers: true,
        ...job.data,
      });
    });

    it('should not allow users with duplicate properties in map to be added twice', async () => {
      const job = DistributePostInBatchesJobFake();
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.EVERYONE;
      job.data.shouldNotify = true;
      const post = PostEntityFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      const followerFeedPage = FeedEntityFake();
      followerFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', ['followerFeedId']);
      // @ts-ignore
      userPropMapEntitiesPage?.userPropertyKvP['user2'] = [
        'followerFeedId',
        'followerFeedId',
      ];
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue([followerFeedPage]);
      consumer[
        'distributePostsToFollowersWorker'
      ].distributePostsToFollowingPostsFeed = jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockReturnValue(true);
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostsToFollowersWorker']
          .distributePostsToFollowingPostsFeed;
      // @ts-ignore
      const calls = distFunc.mock.calls;
      expect(calls[0][0]).toStrictEqual({
        userIds: [post.author.id],
        shouldNotifyFollowers: true,
        ...job.data,
      });
      expect(calls[1][0]).toStrictEqual({
        userIds: ['user1', 'user2'],
        shouldNotifyFollowers: true,
        ...job.data,
      });
    });

    it('should distribute to inner circle list if the post access is set to inner circle', async () => {
      const post = PostEntityFake();
      const job = DistributePostInBatchesJobFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.INNER_CIRCLE;
      job.data.shouldNotify = true;
      job.data.postId = post.id;
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      const innerCircleFeedPage = FeedEntityFake();
      innerCircleFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', [
        'innerCircleFeedId1',
      ]);
      userPropMapEntitiesPage.setOrAppendProperty('user2', [
        'followingFeedId',
        'innerCircleFeedId2',
      ]);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['userListService'].findInnerCircleByOwnerId = jest
        .fn()
        .mockResolvedValue([innerCircleFeedPage]);
      consumer['userListService'].findAllPages = jest
        .fn()
        .mockResolvedValue([innerCircleFeedPage]);
      consumer['distributePostToListsWorker'].distributePostsToLists =
        jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockImplementation((v: string) => {
          return v.startsWith('followingFeed');
        });
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostToListsWorker'].distributePostsToLists;
      // @ts-ignore
      expect(distFunc.mock.calls[0][0]).toStrictEqual({
        listIds: [innerCircleListId(post.authorId)],
        postId: post.id,
        postType: post.type,
      });
      // @ts-ignore
      expect(distFunc.mock.calls[1][0]).toStrictEqual({
        listIds: ['innerCircleFeedId1', 'innerCircleFeedId2'],
        postId: post.id,
        postType: post.type,
      });
    });

    it(`should distribute to inner circle's members following feed when post access is inner circle`, async () => {
      const post = PostEntityFake();
      const job = DistributePostInBatchesJobFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.INNER_CIRCLE;
      job.data.shouldNotify = true;
      job.data.postId = post.id;
      const innerCircleFeedPage = FeedEntityFake();
      innerCircleFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', [
        'innerCircleFeedId1',
      ]);
      userPropMapEntitiesPage.setOrAppendProperty('user2', [
        'followingFeedId',
        'innerCircleFeedId2',
      ]);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['userListService'].findInnerCircleByOwnerId = jest
        .fn()
        .mockResolvedValue([innerCircleFeedPage]);
      consumer['userListService'].findAllPages = jest
        .fn()
        .mockResolvedValue([innerCircleFeedPage]);
      consumer['distributePostToListsWorker'].distributePostsToLists =
        jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockImplementation((v: string) => {
          return v.startsWith('followingFeed');
        });
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostsToFollowersWorker']
          .distributePostsToFollowingPostsFeed;
      // @ts-ignore
      expect(distFunc.mock.calls[0][0]).toStrictEqual({
        userIds: ['user2'],
        ...job.data,
        postId: post.id,
        shouldNotifyFollowers: true,
      });
    });

    it('should distribute to specific list if post access is list', async () => {
      const post = PostEntityFake();
      const job = DistributePostInBatchesJobFake();
      post.author = UserEntityFake();
      consumer['postService'].findById = jest.fn().mockResolvedValue(post);
      job.data.accessControl.postVisibilityAccessData.access =
        PostVisibilityAccess.LIST;
      job.data.accessControl.postVisibilityAccessData.listIds = [
        'innerCircleFeedId',
      ];
      job.data.shouldNotify = true;
      job.data.postId = post.id;
      const innerCircleFeedPage = FeedEntityFake();
      innerCircleFeedPage.ids = ['user1', 'user2'];
      const userPropMapEntitiesPage = UserPropertyMapEntityFake();
      userPropMapEntitiesPage.setOrAppendProperty('user1', [
        'innerCircleFeedId1',
      ]);
      userPropMapEntitiesPage.setOrAppendProperty('user2', [
        'innerCircleFeedId2',
      ]);
      consumer['userPropMapService'].findAllByOwnerId = jest
        .fn()
        .mockResolvedValue([userPropMapEntitiesPage]);
      consumer['userListService'].findAllPages = jest
        .fn()
        .mockResolvedValue([innerCircleFeedPage]);
      consumer['distributePostToListsWorker'].distributePostsToLists =
        jest.fn();
      consumer['userPropMapService'].isFollowingFeedId = jest
        .fn()
        .mockImplementation((v: string) => {
          return v.startsWith('followingFeed');
        });
      await consumer.distributePosts(job);
      const distFunc =
        consumer['distributePostToListsWorker'].distributePostsToLists;
      // @ts-ignore
      expect(distFunc.mock.calls[0][0]).toStrictEqual({
        listIds: ['innerCircleFeedId1', 'innerCircleFeedId2'],
        postId: post.id,
        postType: post.type,
      });
    });
  });
});
