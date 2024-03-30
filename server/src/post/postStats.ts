export interface PostEntityStats {
  likeCount: number;
  realCount: number;
  applauseCount: number;
  shareCount: number;
  repostCount: number;
  commentCount: number;
  reportCount: number;
  hasHiddenComments?: boolean;
}

const emptyStats = (): PostEntityStats => {
  return {
    likeCount: 0,
    realCount: 0,
    applauseCount: 0,
    shareCount: 0,
    repostCount: 0,
    commentCount: 0,
    reportCount: 0,
  };
};
