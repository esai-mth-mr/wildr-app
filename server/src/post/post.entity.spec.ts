import { PostEntity } from './post.entity';
import { ReactionType } from '../generated-graphql';

describe('setReactionCount', () => {
  let post: PostEntity;

  beforeEach(() => {
    post = new PostEntity();
  });

  it('updates real count with REAL', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.REAL, count);
    expect(post.stats.realCount).toEqual(count);
  });

  it('updates real count with UN_REAL', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.UN_REAL, count);
    expect(post.stats.realCount).toEqual(count);
  });

  it('updates applause count APPLAUD', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.APPLAUD, count);
    expect(post.stats.applauseCount).toEqual(count);
  });

  it('updates applause count UN_APPLAUD', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.UN_APPLAUD, count);
    expect(post.stats.applauseCount).toEqual(count);
  });

  it('updates like count with LIKE', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.LIKE, count);
    expect(post.stats.likeCount).toEqual(count);
  });

  it('updates like count with UN_LIKE', () => {
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount(ReactionType.UN_LIKE, count);
    expect(post.stats.likeCount).toEqual(count);
  });

  it('ignores unknown reaction type', () => {
    const originalStats = post.stats;
    const count = Math.floor(Math.random() * 100);
    post.setReactionCount('unknown' as ReactionType, count);
    expect(post.stats).toEqual(originalStats);
  });
});
