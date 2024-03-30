/**
 * We did not use {@link graphql.ts} fil to create TS types for our
 * generated schema because `interface` instead of `class` is needed to
 * successfully store JSONB into {@link PostEntity}
 */
import {
  CommenterScope,
  CommentPostingAccess as GqlCommentPostingAccess,
  CommentPostingAccessData as GqlCommentPostingAccessData,
  CommentVisibilityAccess as GqlCommentVisibilityAccess,
  CommentVisibilityAccessData as GqlCommentVisibilityAccessData,
  PostAccessControl as GqlPostAccessControl,
  PostVisibility,
  PostVisibilityAccess as GqlPostVisibilityAccess,
  PostVisibilityAccessData as GqlPostVisibilityAccessData,
  RepostAccess as GqlRepostAccess,
  RepostAccessData as GqlRepostAccessData,
} from '@verdzie/server/generated-graphql';

//region PostVisibility
export enum PostVisibilityAccess {
  // NONE = 0,
  // AUTHOR = 1,
  EVERYONE = 2,
  FOLLOWERS = 3,
  INNER_CIRCLE = 4,
  LIST = 5,
}

export const fromGqlPostVisibilityAccessEnum = (
  value: GqlPostVisibilityAccess
): PostVisibilityAccess => {
  switch (value) {
    case GqlPostVisibilityAccess.EVERYONE:
      return PostVisibilityAccess.EVERYONE;
    case GqlPostVisibilityAccess.FOLLOWERS:
      return PostVisibilityAccess.FOLLOWERS;
    case GqlPostVisibilityAccess.INNER_CIRCLE:
      return PostVisibilityAccess.INNER_CIRCLE;
    case GqlPostVisibilityAccess.LIST:
      return PostVisibilityAccess.LIST;
  }
};

export const toGqlPostVisibilityAccessEnum = (
  value: PostVisibilityAccess
): GqlPostVisibilityAccess => {
  switch (value) {
    case PostVisibilityAccess.EVERYONE:
      return GqlPostVisibilityAccess.EVERYONE;
    case PostVisibilityAccess.FOLLOWERS:
      return GqlPostVisibilityAccess.FOLLOWERS;
    case PostVisibilityAccess.INNER_CIRCLE:
      return GqlPostVisibilityAccess.INNER_CIRCLE;
    case PostVisibilityAccess.LIST:
      return GqlPostVisibilityAccess.LIST;
  }
};

export interface PostVisibilityAccessData {
  access: PostVisibilityAccess;
  listIds?: string[];
}

export const fromGqlPostVisibilityAccessData = (
  data: GqlPostVisibilityAccessData
): PostVisibilityAccessData => {
  return {
    access: fromGqlPostVisibilityAccessEnum(data.access),
    listIds: data.listIds ?? undefined,
  };
};
//endregion

//region CommentVisibility
export enum CommentVisibilityAccess {
  NONE = 0,
  AUTHOR = 1,
  EVERYONE = 2,
  FOLLOWERS = 3,
  INNER_CIRCLE = 4,
  LIST = 5,
}

export const fromGqlCommentVisibilityAccessEnum = (
  value: GqlCommentVisibilityAccess
): CommentVisibilityAccess => {
  switch (value) {
    case GqlCommentVisibilityAccess.AUTHOR:
      return CommentVisibilityAccess.AUTHOR;
    case GqlCommentVisibilityAccess.EVERYONE:
      return CommentVisibilityAccess.EVERYONE;
    case GqlCommentVisibilityAccess.FOLLOWERS:
      return CommentVisibilityAccess.FOLLOWERS;
    case GqlCommentVisibilityAccess.INNER_CIRCLE:
      return CommentVisibilityAccess.INNER_CIRCLE;
    case GqlCommentVisibilityAccess.LIST:
      return CommentVisibilityAccess.LIST;
    case GqlCommentVisibilityAccess.NONE:
      return CommentVisibilityAccess.NONE;
  }
};

export const toGqlCommentVisibilityAccessEnum = (
  value: CommentVisibilityAccess
): GqlCommentVisibilityAccess => {
  switch (value) {
    case CommentVisibilityAccess.NONE:
      return GqlCommentVisibilityAccess.NONE;
    case CommentVisibilityAccess.AUTHOR:
      return GqlCommentVisibilityAccess.AUTHOR;
    case CommentVisibilityAccess.EVERYONE:
      return GqlCommentVisibilityAccess.EVERYONE;
    case CommentVisibilityAccess.FOLLOWERS:
      return GqlCommentVisibilityAccess.FOLLOWERS;
    case CommentVisibilityAccess.INNER_CIRCLE:
      return GqlCommentVisibilityAccess.INNER_CIRCLE;
    case CommentVisibilityAccess.LIST:
      return GqlCommentVisibilityAccess.LIST;
  }
};

export interface CommentVisibilityAccessData {
  access: CommentVisibilityAccess;
  listIds?: string[];
}

export const fromGqlCommentVisibilityAccessData = (
  data: GqlCommentVisibilityAccessData
): CommentVisibilityAccessData => {
  return {
    access: fromGqlCommentVisibilityAccessEnum(data.access),
    listIds: data.listIds ?? undefined,
  };
};
//endregion

//region Comment Posting Access
export enum CommentPostingAccess {
  NONE = 0,
  EVERYONE = 2,
  FOLLOWERS = 3,
  INNER_CIRCLE = 4,
  LIST = 5,
}

export const fromGqlCommentPostingAccessEnum = (
  value: GqlCommentPostingAccess
): CommentPostingAccess => {
  switch (value) {
    case GqlCommentPostingAccess.NONE:
      return CommentPostingAccess.NONE;
    case GqlCommentPostingAccess.EVERYONE:
      return CommentPostingAccess.EVERYONE;
    case GqlCommentPostingAccess.FOLLOWERS:
      return CommentPostingAccess.FOLLOWERS;
    case GqlCommentPostingAccess.INNER_CIRCLE:
      return CommentPostingAccess.INNER_CIRCLE;
    case GqlCommentPostingAccess.LIST:
      return CommentPostingAccess.LIST;
  }
};

export const toGqlCommentPostingAccessEnum = (
  value: CommentPostingAccess
): GqlCommentPostingAccess => {
  switch (value) {
    case CommentPostingAccess.NONE:
      return GqlCommentPostingAccess.NONE;
    case CommentPostingAccess.EVERYONE:
      return GqlCommentPostingAccess.EVERYONE;
    case CommentPostingAccess.FOLLOWERS:
      return GqlCommentPostingAccess.FOLLOWERS;
    case CommentPostingAccess.INNER_CIRCLE:
      return GqlCommentPostingAccess.INNER_CIRCLE;
    case CommentPostingAccess.LIST:
      return GqlCommentPostingAccess.LIST;
  }
};

export interface CommentPostingAccessData {
  access: CommentPostingAccess;
  listIds?: string[];
}

export const fromGqlCommentPostingAccessData = (
  data: GqlCommentPostingAccessData
): CommentPostingAccessData => {
  return {
    access: fromGqlCommentPostingAccessEnum(data.access),
    listIds: data.listIds ?? undefined,
  };
};
//endregion

//region Repost Access
export enum RepostAccess {
  EMPTY = -1,
  NONE = 0,
  EVERYONE = 1,
  FOLLOWERS = 2,
  INNER_CIRCLE = 3,
  LIST = 4,
}

export const fromGqlRepostAccessEnum = (
  value: GqlRepostAccess
): RepostAccess => {
  switch (value) {
    case GqlRepostAccess.NONE:
      return RepostAccess.NONE;
    case GqlRepostAccess.EVERYONE:
      return RepostAccess.EVERYONE;
    case GqlRepostAccess.FOLLOWERS:
      return RepostAccess.FOLLOWERS;
    case GqlRepostAccess.INNER_CIRCLE:
      return RepostAccess.INNER_CIRCLE;
    case GqlRepostAccess.LIST:
      return RepostAccess.LIST;
  }
};

export const toGqlRepostAccess = (value: RepostAccess): GqlRepostAccess => {
  switch (value) {
    case RepostAccess.NONE:
    case RepostAccess.EMPTY:
      return GqlRepostAccess.NONE;
    case RepostAccess.EVERYONE:
      return GqlRepostAccess.EVERYONE;
    case RepostAccess.FOLLOWERS:
      return GqlRepostAccess.FOLLOWERS;
    case RepostAccess.INNER_CIRCLE:
      return GqlRepostAccess.INNER_CIRCLE;
    case RepostAccess.LIST:
      return GqlRepostAccess.LIST;
  }
};

export interface RepostAccessData {
  access: RepostAccess;
  listIds?: string[];
}

export const defaultRepostAccessData: RepostAccessData = {
  access: RepostAccess.EMPTY,
};

export const fromGqlRepostAccessData = (
  data?: GqlRepostAccessData | null
): RepostAccessData => {
  if (!data) return defaultRepostAccessData;
  return {
    access: fromGqlRepostAccessEnum(data.access),
    listIds: data.listIds ?? undefined,
  };
};

//endregion

export interface PostAccessControl {
  postVisibilityAccessData: PostVisibilityAccessData;
  commentVisibilityAccessData: CommentVisibilityAccessData;
  commentPostingAccessData: CommentPostingAccessData;
  repostAccessData?: RepostAccessData;
}

export const fromGqlPostAccessControl = (
  data?: GqlPostAccessControl
): PostAccessControl | undefined => {
  if (!data) return undefined;
  return {
    postVisibilityAccessData: fromGqlPostVisibilityAccessData(
      data.postVisibilityAccessData
    ),
    commentVisibilityAccessData: fromGqlCommentVisibilityAccessData(
      data.commentVisibilityAccessData
    ),
    commentPostingAccessData: fromGqlCommentPostingAccessData(
      data.commentPostingAccessData
    ),
    repostAccessData: fromGqlRepostAccessData(data.repostAccessData),
  };
};

export const backwardCompatiblePostAccessControl = (
  postVisibility: PostVisibility = PostVisibility.ALL,
  commenterScope: CommenterScope = CommenterScope.ALL
): PostAccessControl => {
  return {
    postVisibilityAccessData: {
      access:
        postVisibility === PostVisibility.ALL
          ? PostVisibilityAccess.EVERYONE
          : PostVisibilityAccess.FOLLOWERS,
    },
    commentPostingAccessData: {
      access:
        commenterScope == CommenterScope.ALL
          ? CommentPostingAccess.EVERYONE
          : CommentPostingAccess.FOLLOWERS,
    },
    commentVisibilityAccessData: {
      access:
        commenterScope == CommenterScope.ALL
          ? CommentVisibilityAccess.EVERYONE
          : CommentVisibilityAccess.FOLLOWERS,
    },
    repostAccessData: defaultRepostAccessData,
  };
};

export const defaultPostAccessControl = (): PostAccessControl => {
  return {
    postVisibilityAccessData: {
      access: PostVisibilityAccess.EVERYONE,
    },
    commentPostingAccessData: {
      access: CommentPostingAccess.EVERYONE,
    },
    commentVisibilityAccessData: {
      access: CommentVisibilityAccess.EVERYONE,
    },
    repostAccessData: defaultRepostAccessData,
  };
};
