import { CommentEntity } from './comment.entity';

describe('CommentEntity', () => {
  describe('decrementLikes', () => {
    it(`should reduce the comment's like stat`, () => {
      const comment = new CommentEntity();
      comment._stats.likeCount = 1;
      comment.decrementLikes();
      expect(comment._stats.likeCount).toBe(0);
    });

    it(`should not allow likes to be negative`, () => {
      const comment = new CommentEntity();
      comment._stats.likeCount = 0;
      comment.decrementLikes();
      expect(comment._stats.likeCount).toBe(0);
    });
  });

  describe('decrementReportCount', () => {
    it(`should reduce the comment's report count stat`, () => {
      const comment = new CommentEntity();
      comment._stats.reportCount = 1;
      comment.decrementReportCount();
      expect(comment._stats.likeCount).toBe(0);
    });

    it(`should not allow likes to be negative`, () => {
      const comment = new CommentEntity();
      comment._stats.reportCount = 0;
      comment.decrementReportCount();
      expect(comment._stats.reportCount).toBe(0);
    });
  });
});
