import { PostEntity } from '../post.entity';
import { faker } from '@faker-js/faker';
import { postStatsFake } from './postStats.fake';
import { activityDataFake } from '../../activity/testing/activity-data.fake';
import {
  ImagePostPropertiesFake,
  TextPostPropertiesFake,
} from '@verdzie/server/post/testing/postProperties.fake';
import {
  CommentPostingAccess,
  CommentVisibilityAccess,
  PostVisibilityAccess,
} from '@verdzie/server/post/postAccessControl';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { nanoid } from 'nanoid';
import { PostType } from '@verdzie/server/post/data/post-type';

export const PostEntityFake = (overrides?: Partial<PostEntity>): PostEntity => {
  const post = new PostEntity();
  const id = nanoid(16);
  post.id = id;
  post.authorId = nanoid(16);
  post.commentFeedId = toFeedId(FeedEntityType.COMMENT, id);
  post.commentScopeType = 0;
  post._stats = postStatsFake();
  post.captionBodyStr = faker.lorem.sentence();
  post.activityData = activityDataFake();
  post.wasBypassed = faker.datatype.boolean();
  post.isPrivate = faker.datatype.boolean();
  post.type = faker.helpers.arrayElement([
    PostType.IMAGE,
    PostType.TEXT,
    PostType.VIDEO,
  ]);
  post.createdAt = faker.date.past();
  post.multiPostProperties = [TextPostPropertiesFake()];
  return Object.assign(post, overrides);
};

export const ImagePostFake = (overrides?: Partial<PostEntity>): PostEntity => {
  const post = PostEntityFake();
  post.type = 5;
  post.multiPostProperties = [ImagePostPropertiesFake()];
  post.isPrivate = false;
  post.accessControl = {
    postVisibilityAccessData: {
      access: PostVisibilityAccess.EVERYONE,
    },
    commentPostingAccessData: {
      access: CommentPostingAccess.EVERYONE,
    },
    commentVisibilityAccessData: {
      access: CommentVisibilityAccess.EVERYONE,
    },
  };
  return Object.assign(post, overrides);
};

export const PublicPostEntityFake = (
  overrides?: Partial<PostEntity>
): PostEntity => {
  const post = PostEntityFake();
  post.isPrivate = false;
  post.accessControl = {
    postVisibilityAccessData: {
      access: PostVisibilityAccess.EVERYONE,
    },
    commentPostingAccessData: {
      access: CommentPostingAccess.EVERYONE,
    },
    commentVisibilityAccessData: {
      access: CommentVisibilityAccess.EVERYONE,
    },
  };
  return Object.assign(post, overrides);
};
