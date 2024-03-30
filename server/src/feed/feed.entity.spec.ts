import { FeedEntity } from './feed.entity';

describe('FeedEntity', () => {
  describe('tryUnshiftEntry', () => {
    it(`should add an entry to the feed and update count`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id2');
      feed._count = 1;
      feed.tryUnshiftEntry('id1');
      expect(feed.ids).toHaveLength(2);
      expect(feed.ids[0]).toBe('id1');
      expect(feed._count).toBe(2);
    });

    it(`should not allow duplicates if shouldSkipHasEntry is false`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      feed._count = 1;
      feed.tryUnshiftEntry('id1');
      expect(feed.ids).toHaveLength(1);
      expect(feed._count).toBe(1);
    });

    it(`should allow duplicates if shouldSkipHasEntry is true`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      feed._count = 1;
      feed.tryUnshiftEntry('id1', true);
      expect(feed.ids).toHaveLength(2);
      expect(feed.ids[0]).toBe('id1');
      expect(feed._count).toBe(2);
    });
  });

  describe('tryRemoveEntry', () => {
    it(`should remove an entry from the feed and update count`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1', 'id2');
      feed._count = 2;
      feed.tryRemoveEntry('id1');
      expect(feed.ids).toHaveLength(1);
      expect(feed._count).toBe(1);
    });

    it(`should not allow _count to be negative`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      feed._count = 0;
      feed.tryRemoveEntry('id1');
      expect(feed.ids).toHaveLength(0);
      expect(feed._count).toBe(0);
    });
  });

  describe('hasEntry', () => {
    it(`should return true if the feed has the entry`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      expect(feed.hasEntry('id1')).toBe(true);
    });

    it(`should return false if the feed does not have the entry`, () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      expect(feed.hasEntry('id2')).toBe(false);
    });
  });

  describe('unshiftToFeedSet', () => {
    it('should add an entry to the feed and update count', () => {
      const feed = new FeedEntity();
      feed.ids.push('id2');
      feed._count = 1;
      const result = feed.unshiftToFeedSet('id1');
      expect(feed.ids).toHaveLength(2);
      expect(feed.ids[0]).toBe('id1');
      expect(feed._count).toBe(2);
      expect(result.added).toBe(true);
    });

    it('should not allow duplicates', () => {
      const feed = new FeedEntity();
      feed.ids.push('id1');
      feed._count = 1;
      const result = feed.unshiftToFeedSet('id1');
      expect(feed.ids).toHaveLength(1);
      expect(feed._count).toBe(1);
      expect(result.added).toBe(false);
    });

    it('should remove existing duplicates', () => {
      const feed = new FeedEntity();
      feed.ids.push('id1', 'id1');
      feed._count = 2;
      const result = feed.unshiftToFeedSet('id2');
      expect(feed.ids).toHaveLength(2);
      expect(feed._count).toBe(2);
      expect(result.added).toBe(true);
      expect(feed.ids).toEqual(['id2', 'id1']);
    });
  });
});
