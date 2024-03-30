import { UserListVisibility as GqlUserListVisibility } from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';

export enum UserListVisibility {
  NONE = 0,
  AUTHOR = 1,
  EVERYONE = 2,
  FOLLOWERS = 3,
  INNER_CIRCLE = 4,
}

export interface ListVisibility {
  follower: UserListVisibility;
  following: UserListVisibility;
}

export interface VisibilityPreferences {
  list: ListVisibility;
}

export function toGqlVisibilityPreferences(user: UserEntity) {
  return user.visibilityPreferences
    ? {
        list: {
          follower: toGqlUserListVisibility(
            user.visibilityPreferences.list.follower
          ),
          following: toGqlUserListVisibility(
            user.visibilityPreferences.list.following
          ),
        },
      }
    : undefined;
}

export function toUserListVisibility(value: string) {
  switch (value) {
    case 'NONE':
      return UserListVisibility.NONE;
    case 'AUTHOR':
      return UserListVisibility.AUTHOR;
    case 'EVERYONE':
      return UserListVisibility.EVERYONE;
    case 'FOLLOWERS':
      return UserListVisibility.FOLLOWERS;
    case 'INNER_CIRCLE':
      return UserListVisibility.INNER_CIRCLE;
    default:
      return UserListVisibility.EVERYONE;
  }
}

export function toGqlUserListVisibility(value: UserListVisibility) {
  switch (value) {
    case UserListVisibility.NONE:
      return GqlUserListVisibility.NONE;
    case UserListVisibility.AUTHOR:
      return GqlUserListVisibility.AUTHOR;
    case UserListVisibility.EVERYONE:
      return GqlUserListVisibility.EVERYONE;
    case UserListVisibility.FOLLOWERS:
      return GqlUserListVisibility.FOLLOWERS;
    case UserListVisibility.INNER_CIRCLE:
      return GqlUserListVisibility.INNER_CIRCLE;
    default:
      return GqlUserListVisibility.EVERYONE;
  }
}
