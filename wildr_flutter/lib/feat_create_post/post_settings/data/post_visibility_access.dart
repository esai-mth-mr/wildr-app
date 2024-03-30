import 'package:wildr_flutter/feat_create_post/post_settings/data/repost_access.dart';

enum PostVisibilityAccess {
  EVERYONE,
  FOLLOWERS,
  INNER_CIRCLE,
  LIST,
}

PostVisibilityAccess fromGqlPostVisibilityAccess(String value) {
  switch (value) {
    case 'EVERYONE':
      return PostVisibilityAccess.EVERYONE;
    case 'FOLLOWERS':
      return PostVisibilityAccess.FOLLOWERS;
    case 'INNER_CIRCLE':
      return PostVisibilityAccess.INNER_CIRCLE;
    case 'LIST':
      return PostVisibilityAccess.LIST;
    default:
      return PostVisibilityAccess.EVERYONE;
  }
}

extension PostVisibilityAccessExt on PostVisibilityAccess {
  String toViewString() {
    switch (this) {
      case PostVisibilityAccess.EVERYONE:
        return 'Everyone';
      case PostVisibilityAccess.FOLLOWERS:
        return 'Followers';
      case PostVisibilityAccess.INNER_CIRCLE:
        return 'Inner Circle';
      case PostVisibilityAccess.LIST:
        return 'List';
    }
  }

  RepostAccess repostAccess() {
    if (this == PostVisibilityAccess.EVERYONE) {
      return RepostAccess.EVERYONE;
    } else {
      return RepostAccess.NONE;
    }
  }
}
