import { Process, Processor } from '@nestjs/bull';
import { forwardRef, Inject } from '@nestjs/common';
import { FeedEntity } from '../../feed/feed.entity';
import { FeedService } from '../../feed/feed.service';
import { UserEntity } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  DISTRIBUTE_POSTS_QUEUE_NAME,
  DISTRIBUTE_POST_IN_BATCHES_JOB_NAME,
  DistributePostInBatchesJob,
  DistributePostToFollowersInBatchesJob,
} from './distributePosts.producer';
import { DistributePostsToFollowingPostsFeedProducer } from './distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.producer';
import { NotifyFollowersAboutPostsProducer } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPosts.producer';
import { PostService } from '@verdzie/server/post/post.service';
import { UserPropertyMapService } from '@verdzie/server/user-property-map/userPropertyMap.service';
import { UserPropertyMap } from '@verdzie/server/user-property-map/userPropertyMap.entity';
import { DistributePostToListsProducer } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.producer';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';

export const POST_DISTRIBUTION_BATCH_SIZE = 10;

@Processor(DISTRIBUTE_POSTS_QUEUE_NAME)
export class DistributePostsConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly distributePostsToFollowersWorker: DistributePostsToFollowingPostsFeedProducer,
    private readonly distributePostToListsWorker: DistributePostToListsProducer,
    private readonly notifyFollowersAboutPostWorker: NotifyFollowersAboutPostsProducer,
    private readonly userPropMapService: UserPropertyMapService,
    private readonly userListService: UserListService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  /**
   * Iterating through a single page of 65,000 entries (of ids and map) takes
   * at max 8 ms
   *
   * Test Platform: {@link https://www.typescriptlang.org/play}
   *
   * Code
   * ```
   let list: number[] = [];
   let map: Map<string, string[]> = new Map();
   for(let value of [...Array(65000).keys()]) {
         list.push(value);
         map.set(`${value}`, [`${value}`, `${value + value}`])
     }
   list = list.reverse();
   var start = new Date().getTime();
   let counter = 0;
   for(let listItem of list) {
      if(map.get(`${listItem}`) !== undefined) {
        counter++;
      }
     }
   var end = new Date().getTime();
   var time = end - start;
   console.log('millisecond ' + time); //millisecond  8
   console.log('counter ' + counter); //counter 65000
   * ```
   */
  //TODO: Move to a worker
  private async idsPageToMapPageDistribution(
    ids: string[],
    propMap: UserPropertyMap,
    post: PostEntity,
    args: DistributePostInBatchesJob
  ) {
    this.logger.info('idsPageToMapPageDistribution', { mapSize: propMap.size });
    const followerIdsSet = new Set<string>();
    const listIdsSet = new Set<string>();
    for (const userId of ids) {
      const props = propMap.get(userId);
      if (props) {
        props.forEach(id => {
          if (this.userPropMapService.isFollowingFeedId(id)) {
            followerIdsSet.add(userId);
          } else {
            listIdsSet.add(id);
          }
        });
      }
    }
    const followerIds = Array.from(followerIdsSet);
    const listIds = Array.from(listIdsSet);
    this.logger.info('listIds', { listIds: [...listIdsSet] });
    //Prepare batches
    for (let i = 0; i < followerIds.length; i += POST_DISTRIBUTION_BATCH_SIZE) {
      const chunk = followerIds.slice(i, i + POST_DISTRIBUTION_BATCH_SIZE);
      this.logger.info('distributing to followers chunk', {
        followerIds: chunk,
      });
      await this.distributePostsToFollowersWorker.distributePostsToFollowingPostsFeed(
        {
          userIds: chunk,
          shouldNotifyFollowers: args.shouldNotify ?? false,
          ...args,
        }
      );
    }
    for (let i = 0; i < listIds.length; i += POST_DISTRIBUTION_BATCH_SIZE) {
      const chunk = listIds.slice(i, i + POST_DISTRIBUTION_BATCH_SIZE);
      await this.distributePostToListsWorker.distributePostsToLists({
        listIds: chunk,
        postId: post.id,
        postType: post.type,
      });
    }
  }

  @Process(DISTRIBUTE_POST_IN_BATCHES_JOB_NAME)
  async distributePosts(job: Job<DistributePostInBatchesJob>) {
    try {
      const args: DistributePostInBatchesJob = job.data;
      const post = await this.postService.findById(args.postId);
      if (!post) {
        this.logger.error('Could not find post', { postId: args.postId });
        return;
      }
      let postAuthor = post.author;
      if (!postAuthor) {
        postAuthor = await this.userService.findById(post.authorId);
      }
      if (!postAuthor) {
        this.logger.error('Could not find author', {
          postId: args.postId,
          authorId: post.authorId,
        });
        return;
      }
      //Iterate through the listIds and get the status form userPropertyMap
      const userPropMapEntities =
        await this.userPropMapService.findAllByOwnerId(postAuthor.id);
      if (userPropMapEntities.length === 0) {
        this.logger.info('userPropMapEntities empty', {
          authorId: postAuthor.id,
        });
        return;
      }
      const feedPagesCombined: string[][] = [];
      this.logger.info('MapEntries length', {
        length: userPropMapEntities.length,
      });
      const postVisibilityAccessData =
        args.accessControl.postVisibilityAccessData;
      this.logger.info('postVisibilityAccessData', {
        postVisibilityAccessData,
      });
      switch (postVisibilityAccessData.access) {
        case PostVisibilityAccess.EVERYONE:
        case PostVisibilityAccess.FOLLOWERS:
          this.logger.info('Distributing to followers');
          const followerFeedEntities = await this.feedService.findAllPagesById(
            postAuthor.followerFeedId ?? ''
          );
          followerFeedEntities.forEach(entity =>
            feedPagesCombined.push(entity.ids)
          );
          this.logger.info('followerFeedEntities length', {
            length: followerFeedEntities.length,
          });
          this.logger.info('Distributing to author of the post', {});
          await this.distributePostsToFollowersWorker.distributePostsToFollowingPostsFeed(
            {
              userIds: [postAuthor.id],
              shouldNotifyFollowers: args.shouldNotify ?? false,
              ...args,
            }
          );
          break;
        case PostVisibilityAccess.INNER_CIRCLE:
          this.logger.info('Distributing to INNER_CIRCLE');
          const innerCircleMembersFirstPage =
            await this.userListService.findInnerCircleByOwnerId(postAuthor.id);
          const innerCircleEntities = await this.userListService.findAllPages(
            innerCircleMembersFirstPage?.id ?? ''
          );
          innerCircleEntities.forEach(entity =>
            feedPagesCombined.push(entity.ids)
          );
          this.logger.info('Distributing to author');
          await this.distributePostToListsWorker.distributePostsToLists({
            listIds: [innerCircleListId(post.authorId)],
            postId: post.id,
            postType: post.type,
          });
          break;
        case PostVisibilityAccess.LIST:
          const listEntities: UserListEntity[] = [];
          if (!postVisibilityAccessData.listIds) {
            this.logger.error('Target type = LIST but listIds = null');
            return;
          }
          for (const listId of postVisibilityAccessData.listIds) {
            const entities = await this.userListService.findAllPages(listId);
            listEntities.push(...entities);
          }
          listEntities.forEach(entity => feedPagesCombined.push(entity.ids));
          break;
      }
      for (const map of userPropMapEntities) {
        for (const page of feedPagesCombined) {
          this.logger.info('Page of feedPagesCombined', {});
          await this.idsPageToMapPageDistribution(
            page,
            map.userPropertyMap,
            post,
            args
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * @deprecated Use {@link distributePosts}
   * @param job
   */
  @Process('distribute-post-to-followers-in-batches-job')
  async distributePostsToFollowersInBatches(
    job: Job<DistributePostToFollowersInBatchesJob>
  ) {
    const post = await this.postService.findById(job.data.postId);
    if (!post) return;
    let postAuthor: UserEntity | undefined;
    if (!post.author) {
      postAuthor = await this.userService.findById(post.authorId);
    }
    if (!postAuthor) return;
    const followerFeed = await this.feedService.find(
      postAuthor.followerFeedId ?? ''
    );
    if (!followerFeed) return;
    let after = 0;
    let hasReachedEndOfTheList = false;
    while (!hasReachedEndOfTheList) {
      const [followerIds, hasReachedTheEnd] = await getFollowerIdsBatch(
        followerFeed,
        after,
        this.userService,
        this.logger,
        POST_DISTRIBUTION_BATCH_SIZE
      );
      after += followerIds.length;
      if (job.data.onlyNotify) {
        this.logger.debug('onlyNotify!!');
        await this.notifyFollowersAboutPostWorker.notifyFollowersAboutPosts({
          followerIds,
          postId: post.id,
        });
      } else {
        if (hasReachedTheEnd) {
          followerIds.push(postAuthor.id);
        }
        await this.distributePostsToFollowersWorker.distributePostsToFollowingPostsFeed(
          {
            userIds: followerIds,
            shouldNotifyFollowers: job.data.shouldNotify ?? false,
            ...job.data,
          }
        );
      }
      hasReachedEndOfTheList = hasReachedTheEnd;
    }
  }
}

export const getFollowerIdsBatch = async (
  followerFeed: FeedEntity,
  after = 0,
  userService: UserService,
  logger: Logger,
  batchSize = POST_DISTRIBUTION_BATCH_SIZE
): Promise<[string[], boolean]> => {
  if (!followerFeed) {
    logger.error('getFollowersList() Could not find followerFeed');
    return [[], true];
  }
  const followersIds = followerFeed.page.ids;
  if (followersIds.length == 0) {
    logger.info('getFollowersList() No followers found');
    return [[], true];
  }
  const ids = followersIds.slice(after, after + batchSize);
  logger.debug('IDS length = ', {
    length: ids.length,
    hasReachedTheEnd: ids.length === 0,
  });
  return [ids, ids.length === 0];
};
