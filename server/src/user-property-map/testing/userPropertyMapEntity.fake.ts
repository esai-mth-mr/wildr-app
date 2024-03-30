import { UserPropertyMapEntity } from '../userPropertyMap.entity';

export function UserPropertyMapEntityFake(id?: string): UserPropertyMapEntity {
  const map = new UserPropertyMapEntity(id || 'userPropertyMapEntityId');
  map.setOrAppendProperty('followingUser', ['followerFeedId']);
  map.setOrAppendProperty('innerCircleUser', ['innerCircleFeedId']);
  map.setOrAppendProperty('followingAndInnerCircleUser', [
    'followerFeedId',
    'innerCircleFeedId',
  ]);
  return map;
}

export function UserPropertyMapEntityFakeWithoutUsers(
  overrides: Partial<UserPropertyMapEntity> = {}
) {
  const map = new UserPropertyMapEntity('userPropertyMapEntityId');
  Object.assign(overrides, map);
  return map;
}
