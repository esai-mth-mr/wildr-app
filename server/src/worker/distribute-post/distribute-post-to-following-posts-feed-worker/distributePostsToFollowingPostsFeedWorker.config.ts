import { PostVisibility } from '../../../generated-graphql';

export const DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME =
  'distribute-post-to-followers-queue';
export const DISTRIBUTE_POST_TO_FOLLOWERS_JOB_NAME =
  'distribute-post-to-followers-job';

export interface DistributePostToFollowingPostsJobData {
  postId: string;
  postVisibility: PostVisibility;
  userIds: string[];
  shouldNotifyFollowers: boolean;
  userIdsToSkip?: string[];
}
