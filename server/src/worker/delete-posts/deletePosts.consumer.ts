import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { OpenSearchService } from '@verdzie/server/open-search/openSearch.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import { emptyPostDeleteStats } from '@verdzie/server/post/postDeleteStats';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeleteCommentsProducer } from '../delete-comments/deleteComments.producer';
import { DeletePostsJob } from './deletePosts.producer';

const BATCH_SIZE = 10;

@Processor('delete-posts-queue')
export class DeletePostsConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private postService: PostService,
    private feedService: FeedService,
    private deleteCommentsWorker: DeleteCommentsProducer,
    private openSearchService: OpenSearchService
  ) {
    console.info('DeletePostsConsumer created');
    this.logger = this.logger.child({ context: 'DeletePostsConsumer' });
  }

  @Process('delete-posts-job')
  async deletePosts(job: Job<DeletePostsJob>) {
    this.logger.info(' DELETE POSTS CONSUMER');
    const posts = job.data.posts;
    if (posts) {
      this.logger.info('Found some posts', { length: posts.length });
      for (const post of posts) {
        await this.deletePost(post);
      }
    }
  }

  private async deletePost(post: PostEntity) {
    this.logger.info('Deleting post', { id: post.id });
    if (!post.deleteStatus) post.deleteStatus = emptyPostDeleteStats();
    if (
      post.deleteStatus.hasDeletedComments &&
      post.deleteStatus.hasBeenDeletedFromOpenSearch
    ) {
      this.logger.info('Deleting post now');
      try {
        const realReactionFeedId = post.realReactionFeedId;
        const applaudReactionFeedId = post.applaudReactionFeedId;
        const likeReactionFeedId = post.likeReactionFeedId;
        this.logger.info('Hard Deleting post');
        await this.postService.hardDelete(post);
        this.logger.info('Post Deleted Successfully ', { postId: post.id });
        // - Delete Reactions Feed
        if (realReactionFeedId) {
          await this.feedService.delete(realReactionFeedId);
          this.logger.info('Deleted RealReactionFeed ');
        }
        if (applaudReactionFeedId) {
          await this.feedService.delete(applaudReactionFeedId);
          this.logger.info('Deleted ApplaudReactionFeed ');
        }
        if (likeReactionFeedId) {
          await this.feedService.delete(likeReactionFeedId);
          this.logger.info('Deleted LikeReactionFeed ');
        }
        this.logger.info('Deleted reaction feeds');
      } catch (err) {
        // this.logger.error('FAiled to delete post');
        this.logger.error(err);
      }
      return;
    }
    // - Delete CommentsFeed
    if (post.pinnedCommentId) {
      post.pinnedCommentId = null;
      this.postService.save(post);
      this.logger.info('Removing pinnedComment reference ');
    }
    if (!post.deleteStatus.hasDeletedComments) {
      this.logger.info('Going to delete comments');
      const commentsFeed = await this.feedService.find(post.commentFeedId);
      if (commentsFeed) {
        const ids = commentsFeed.page.ids;
        this.logger.info('Found comments', { length: ids.length });
        for (let index = 0; index < ids.length; index += BATCH_SIZE) {
          this.logger.info('Deleting comments');
          await this.deleteCommentsWorker.deleteComments({
            ids: ids.slice(index, index + BATCH_SIZE),
          });
        }
        post.deleteStatus.hasDeletedComments = true;
        post.commentFeedId = '';
        await this.postService.save(post);
        await this.feedService.deleteEntity(commentsFeed);
        this.logger.info('Deleted comments feed');
      }
    }
    if (!post.deleteStatus.hasBeenDeletedFromOpenSearch) {
      // - Delete OpenSearch entry
      //!!TODO  Check errorCodes for different cases (e.g indexNotFound)
      const isDeletedFromOpenSearch = await this.openSearchService.deletePost(
        post.id
      );
      if (isDeletedFromOpenSearch) {
        post.deleteStatus.hasBeenDeletedFromOpenSearch = true;
        await this.postService.save(post);
      } else {
        this.logger.error(
          'Failed to delete post from OpenSearch, will retry later'
        );
        if (process.env.TROLL_SERVER_DISABLED) {
          this.logger.error('Since we are on local machine');
          post.deleteStatus.hasBeenDeletedFromOpenSearch = true;
          await this.postService.save(post);
        }
      }
    }
  }
}
