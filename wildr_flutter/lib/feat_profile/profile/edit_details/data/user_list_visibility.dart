enum UserListVisibility {
  NONE,
  AUTHOR,
  EVERYONE,
  FOLLOWERS,
  INNER_CIRCLE,
}

UserListVisibility toUserListVisibility(String value) {
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
