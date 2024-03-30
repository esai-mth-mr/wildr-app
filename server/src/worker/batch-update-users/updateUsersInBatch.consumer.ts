import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import {
  ConsumedPostsFeedEnums,
  FeedEntity,
  FeedEntityType,
  PersonalizedFeedEnums,
  UserProfilePrivatePubPostsBasedOnPostTypes,
  UserProfilePubPostsBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import {
  Jobs,
  MiscJobDataUpdateCounts,
} from '@verdzie/server/sqs/misc-sqs-handler/misc-sqs-handler';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { UpdateUsersInBatchJob } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.producer';
import { PrepareInitialFeedProducer } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
import { Logger } from 'winston';
import { OpenSearchIndexService } from '@verdzie/server/open-search/open-search-index/openSearchIndex.service';
import { UserListService } from '@verdzie/server/user-list/userList.service';

@Processor('update-users-in-batch-queue')
export class UpdateUsersInBatchConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly feedService: FeedService,
    private readonly postService: PostService,
    private readonly prepareInitialFeedWorker: PrepareInitialFeedProducer,
    private readonly openSearchIndexService: OpenSearchIndexService
  ) {
    this.logger = this.logger.child({ context: 'UpdateUsersInBatchConsumer' });
  }

  @Process('update-users-in-batch-job')
  async updateInBatch(job: Job<UpdateUsersInBatchJob>) {
    this.logger.debug('updateInBatch()', { job });
    try {
      let emailsToFilter: string[] | undefined;
      if (job.data.input && 'emails' in job.data.input) {
        emailsToFilter = job.data.input.emails;
      }
      let userEntities: UserEntity[];
      if (emailsToFilter) {
        this.logger.info('Emails to filter = ', {
          emailsToFilter: [...emailsToFilter],
        });
        userEntities = await this.userService.repo.find({
          where: {
            email: In(emailsToFilter),
          },
        });
      } else {
        if (!job.data.take === undefined) {
          this.logger.warn(
            'marking job.data.take = undefined will result in' +
              ' querying all the userEntities'
          );
        }
        userEntities = await this.userService.repo
          .createQueryBuilder('user_entity')
          .take(job.data.take)
          .skip(job.data.skip)
          .orderBy(this.orderBy(job.data.jobEnum))
          .getMany();
      }
      this.logger.info('BatchEntitiesSize', { size: userEntities.length });
      if (userEntities.length === 0) return;
      //Perform the job
      switch (job.data.jobEnum) {
        case Jobs.SEND_EMAILS:
          break;
        case Jobs.UPDATE_INVITE_COUNT:
          await this.updateInviteCodes(
            userEntities,
            job.data.input as MiscJobDataUpdateCounts
          );
          break;
        case Jobs.PREPARE_POST_AND_INTERESTS_FEEDS:
          await this.preparePostsAndInterestsFeed(userEntities);
          break;
        case Jobs.MOVE_PROFILE_POSTS_TO_NEW_FEEDS:
          await this.moveProfilePostsFromOldToNewFeed(userEntities);
          break;
        case Jobs.PREPARE_INITIAL_FEEDS:
          await this.prepareInitialFeed(userEntities);
          break;
        case Jobs.MOVE_CONSUMED_TO_EXPLORE:
          await this.moveConsumedToExploreFeed(userEntities);
          break;
        case Jobs.RE_INDEX_SEARCH_ALL_USERS:
          await this.reIndexSearchAllUsers(userEntities);
          break;
        case Jobs.CREATE_INNER_CIRCLE_LIST:
          await this.createInnerCirclesList(userEntities);
          break;
        case Jobs.CREATE_AND_FILL_IC_SUGGESTIONS_LIST:
          await this.createAndFillICSuggestionsList(userEntities);
          break;
        case Jobs.CREATE_AND_FILL_PROPERTY_MAP:
          await this.createAndFillUserPropertyMapEntity(userEntities);
          break;
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private orderBy(job: Jobs): string {
    switch (job) {
      case Jobs.SEND_EMAILS:
        return 'created_at';
      default:
        return 'created_at';
    }
  }

  private async updateInviteCodes(
    userEntities: UserEntity[],
    input: MiscJobDataUpdateCounts
  ) {
    this.logger.info('updateInviteCodes', {
      input,
      batchSize: userEntities.length,
    });
    if (userEntities && userEntities.length > 0) {
      const result = await this.userService.repo.update(
        userEntities.map(entity => entity.id),
        { inviteCount: input?.count ?? 5 }
      );
      this.logger.debug('Result = ', { result });
    } else {
      this.logger.debug('updateInviteCodes() Batch is empty');
    }
  }

  private async preparePostsAndInterestsFeed(userEntities: UserEntity[]) {
    for (const user of userEntities) {
      if (!(await this.userService.generateAllPostRelatedFeeds(user.id))) {
        this.logger.error('Failed to generateAllPostRelatedFeeds');
        return;
      }
      if (!(await this.userService.generateInterestsFeed(user.id))) {
        this.logger.error('Failed to generateInterestsFeed');
        return;
      }
      if (!(await this.userService.generateInterestedAccountsFeed(user.id))) {
        return;
      }
    }
  }

  private async moveProfilePostsFromOldToNewFeed(userEntities: UserEntity[]) {
    try {
      //get the post ids
      //move them to new feeds
      //No need to take care of stories since they are expired anyway
      for (const user of userEntities) {
        const userId = user.id;
        const allPrivatePublicPostsFeed = await this.feedService.find(
          toFeedId(FeedEntityType.USER_PUB_PVT_POSTS, user.id)
        );
        if (!allPrivatePublicPostsFeed) {
          this.logger.info(
            "This user doesn't have any" + ' allPrivatePublicPostsFeed',
            {
              userId,
              handle: user.handle,
            }
          );
          return;
        }
        //get all the posts from existing feeds
        const allPosts = await this.postService.findAllNonExpired(
          allPrivatePublicPostsFeed.page.ids,
          []
        );
        if (allPosts.length === 0) {
          this.logger.info("This user doesn't have posts", {
            userId,
            handle: user.handle,
          });
          return;
        }
        //Public posts
        const pubPrivatePostsFeed = await this.feedService.findOrCreate(
          FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS,
          userId
        );
        pubPrivatePostsFeed.page.ids = allPosts.map(post => {
          if (post) return post.id;
          this.logger.error('PostEntity is empty');
          return '';
        });
        // this.logger.info("allPosts length", {length: allPosts.length})
        // this.logger.info("pubPrivatePostsFeed#page#ids length", {length: pubPrivatePostsFeed.page.ids.length})
        this.logger.info('Length Matches', {
          length: allPosts.length === pubPrivatePostsFeed.page.ids.length,
        });
        const publicPosts: PostEntity[] = allPosts.filter(post => {
          if (post) return !post.isPrivate;
          return false;
        });
        const pubPostsFeed = await this.feedService.findOrCreate(
          FeedEntityType.USER_PROFILE_PUB_ALL_POSTS,
          userId
        );
        pubPostsFeed.page.ids = publicPosts.map(post => post.id);
        await this.feedService.save([pubPrivatePostsFeed, pubPostsFeed]);
        for (let postType = 2; postType <= 5; postType++) {
          const filteredPrivatePubPosts = allPosts.filter(post => {
            if (post) return post.type === postType;
            return false;
          });
          const subPrivatePubPostsFeed = await this.feedService.findOrCreate(
            UserProfilePrivatePubPostsBasedOnPostTypes[postType],
            user.id
          );
          subPrivatePubPostsFeed.page.ids = filteredPrivatePubPosts.map(
            post => post.id
          );
          // this.logger.debug("subPrivatePubPostsFeed.page.ids", {
          //   postType: PostType[postType],
          //   length: subPrivatePubPostsFeed.page.ids.length
          // })
          const filteredPublicPosts = filteredPrivatePubPosts.filter(
            post => !post.isPrivate
          );
          const subPubPostsFeed = await this.feedService.findOrCreate(
            UserProfilePubPostsBasedOnPostTypes[postType],
            user.id
          );
          subPubPostsFeed.page.ids = filteredPublicPosts.map(post => post.id);
          // this.logger.debug("subPubPostsFeed.page.ids", {
          //   postType: PostType[postType],
          //   length: subPrivatePubPostsFeed.page.ids.length
          // })
          await this.feedService.save([
            subPrivatePubPostsFeed,
            subPubPostsFeed,
          ]);
        }
        this.logger.info('Done moveProfilePostsFromOldToNewFeed for user', {
          id: user.id,
          handle: user.handle,
        });
      }
    } catch (e) {
      this.logger.error('Failed moveProfilePostsFromOldToNewFeed', { e });
    }
  }

  private async prepareInitialFeed(userEntities: UserEntity[]) {
    for (const user of userEntities) {
      await this.prepareInitialFeedWorker.prepareInitialFeed({
        userId: user.id,
      });
    }
  }

  private async moveConsumedToExploreFeed(userEntities: UserEntity[]) {
    for (const user of userEntities) {
      //Get user's Explore feed
      this.logger.info('-------------------------------------------');
      this.logger.info('moveConsumedToExploreFeed()', { userId: user.id });
      const updatedExploreFeeds: FeedEntity[] = [];
      for (let i = 0; i < 5; i++) {
        // this.logger.info('Type = ', {
        //   personalizedFeedType: PersonalizedFeedEnums[i],
        //   consumedFeedType: ConsumedPostsFeedEnums[i],
        // });
        const exploreFeed = await this.feedService.findOrCreate(
          PersonalizedFeedEnums[i],
          user.id
        );
        const consumedPostsFeed = await this.feedService.findOrCreate(
          ConsumedPostsFeedEnums[i],
          user.id
        );
        exploreFeed.page.ids.unshift(...consumedPostsFeed.page.ids);
        updatedExploreFeeds.push(exploreFeed);
      }
      await this.feedService.save(updatedExploreFeeds);
      this.logger.info('Feeds Updated', { userId: user.id });
      this.logger.info('-------------------------------------------');
    }
  }

  private async reIndexSearchAllUsers(userEntities: UserEntity[]) {
    try {
      await this.openSearchIndexService.updateUsersInBulk(userEntities);
      this.logger.info(
        'Updated users in bulk',
        userEntities.map(e => e.id)
      );
    } catch (e) {
      this.logger.error(
        'Error updating users in bulk',
        userEntities.map(e => e.id)
      );
    }
  }

  private async createInnerCirclesList(userEntities: UserEntity[]) {
    try {
      for (const user of userEntities) {
        this.logger.info('createInnerCirclesList', { user: user.id });
        await this.userService.createInnerCirclesList(user.id);
      }
    } catch (e) {
      this.logger.error(
        'Error updating users in bulk',
        userEntities.map(e => e.id)
      );
    }
  }

  private async createAndFillICSuggestionsList(userEntities: UserEntity[]) {
    try {
      for (const user of userEntities) {
        await this.userService.createAndFillInnerCirclesSuggestionList(user);
      }
    } catch (e) {
      this.logger.error(
        'Error updating users in bulk',
        userEntities.map(e => e.id)
      );
    }
  }

  /**
   * Performs action in transaction
   * @param userEntities
   * @private
   */
  private async createAndFillUserPropertyMapEntity(userEntities: UserEntity[]) {
    try {
      for (const user of userEntities) {
        await this.userService.createAndFillUserPropertyMapWithFollowers(user);
      }
    } catch (e) {
      this.logger.error(
        'Error updating users in bulk',
        userEntities.map(e => e.id)
      );
    }
  }
}
