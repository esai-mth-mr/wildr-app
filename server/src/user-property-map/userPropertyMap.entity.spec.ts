import { UserPropertyMapEntity } from './userPropertyMap.entity';

describe('UserPropertyMapEntity', () => {
  describe('setOrAppendProperty', () => {
    it('should add a key with new values', () => {
      const map = new UserPropertyMapEntity('id');
      map.setOrAppendProperty('user_1', ['inner_circle_feed_id']);
      expect(map?.userPropertyKvP?.['user_1']).toEqual([
        'inner_circle_feed_id',
      ]);
    });

    it('should add new values to an existing key', () => {
      const map = new UserPropertyMapEntity('id');
      map.setOrAppendProperty('user_1', ['inner_circle_feed_id']);
      map.setOrAppendProperty('user_1', ['follower_feed_id']);
      expect(map?.userPropertyKvP?.['user_1']).toEqual([
        'inner_circle_feed_id',
        'follower_feed_id',
      ]);
    });

    it('should not allow duplicate values', () => {
      const map = new UserPropertyMapEntity('id');
      map.setOrAppendProperty('user_1', ['inner_circle_feed_id']);
      map.setOrAppendProperty('user_1', ['inner_circle_feed_id']);
      expect(map?.userPropertyKvP?.['user_1']).toEqual([
        'inner_circle_feed_id',
      ]);
    });
  });
});
