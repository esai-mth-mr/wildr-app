enum RepostAccess {
  NONE,
  EVERYONE,
  FOLLOWERS,
  INNER_CIRCLE,
  LIST,
}

RepostAccess fromGqlRepostAccess(String value) {
  switch (value) {
    case 'EVERYONE':
      return RepostAccess.EVERYONE;
    case 'FOLLOWERS':
      return RepostAccess.FOLLOWERS;
    case 'INNER_CIRCLE':
      return RepostAccess.INNER_CIRCLE;
    case 'LIST':
      return RepostAccess.LIST;
    default:
      return RepostAccess.NONE;
  }
}

extension RepostAccessExt on RepostAccess {
  String toViewString() {
    switch (this) {
      case RepostAccess.EVERYONE:
        return 'Everyone';
      case RepostAccess.FOLLOWERS:
        return 'Followers';
      case RepostAccess.INNER_CIRCLE:
        return 'Inner Circle';
      case RepostAccess.LIST:
        return 'List';
      // ignore: no_default_cases
      default:
        return 'None';
    }
  }
}
