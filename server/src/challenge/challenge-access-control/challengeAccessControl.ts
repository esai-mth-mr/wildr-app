import {
  CommentPostingAccess,
  CommentPostingAccessData,
  CommentVisibilityAccess,
  CommentVisibilityAccessData,
} from '@verdzie/server/post/postAccessControl';

export interface ChallengeAccessData {
  listIds?: string[];
}

export enum ChallengeVisibilityAccess {
  NONE = 0,
  AUTHOR = 1,
  EVERYONE = 2,
  FOLLOWERS = 3,
  INNER_CIRCLE = 4,
  LIST = 5,
}

export interface ChallengeVisibilityAccessData extends ChallengeAccessData {
  access: ChallengeVisibilityAccess;
}

export interface ChallengeAccessControl {
  visibilityAccessData: ChallengeVisibilityAccessData;
  commentVisibilityAccessData: CommentVisibilityAccessData;
  commentPostingAccessData: CommentPostingAccessData;
}

export const defaultChallengeAccessControl = (): ChallengeAccessControl => {
  return {
    visibilityAccessData: {
      access: ChallengeVisibilityAccess.EVERYONE,
    },
    commentPostingAccessData: {
      access: CommentPostingAccess.EVERYONE,
    },
    commentVisibilityAccessData: {
      access: CommentVisibilityAccess.EVERYONE,
    },
  };
};
