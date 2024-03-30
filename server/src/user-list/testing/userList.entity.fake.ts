import { UserListEntity } from '@verdzie/server/user-list/userList.entity';

export function UserListEntityFake(
  overrides?: Partial<UserListEntity>
): UserListEntity {
  const list = new UserListEntity();
  list.id = 'fakeId';
  list.name = 'fakeName';
  list.iconUrl = 'fakeIconUrl';
  list.ids = [];
  list.metaData = { memberCount: 0 };
  list.createdAt = new Date();
  list.updatedAt = new Date();
  return Object.assign(list, overrides);
}
