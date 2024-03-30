import { PostType } from '@verdzie/server/post/data/post-type';

export const DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME =
  'distribute-post-to-lists-queue';
export const DISTRIBUTE_POSTS_TO_LISTS_JOB_NAME =
  'distribute-post-to-lists-job';

export interface DistributePostToListsJob {
  listIds: string[];
  postId: string;
  postType: PostType;
}
