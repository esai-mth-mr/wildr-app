enum CommentVisibilityAccess {
  AUTHOR,
  EVERYONE,
  FOLLOWERS,
  INNER_CIRCLE,
  LIST,
  NONE,
}

CommentVisibilityAccess fromGqlCommentVisibilityAccess(String? value) {
  switch (value) {
    case 'AUTHOR':
      return CommentVisibilityAccess.AUTHOR;
    case 'EVERYONE':
      return CommentVisibilityAccess.EVERYONE;
    case 'FOLLOWERS':
      return CommentVisibilityAccess.FOLLOWERS;
    case 'INNER_CIRCLE':
      return CommentVisibilityAccess.INNER_CIRCLE;
    case 'LIST':
      return CommentVisibilityAccess.LIST;
    default:
      return CommentVisibilityAccess.NONE;
  }
}

extension CommentVisibilityAccessExt on CommentVisibilityAccess {
  String toViewString() {
    switch (this) {
      case CommentVisibilityAccess.AUTHOR:
        return 'Author';
      case CommentVisibilityAccess.EVERYONE:
        return 'Everyone';
      case CommentVisibilityAccess.FOLLOWERS:
        return 'Followers';
      case CommentVisibilityAccess.INNER_CIRCLE:
        return 'Inner Circle';
      case CommentVisibilityAccess.LIST:
        return 'List';
      case CommentVisibilityAccess.NONE:
        return 'None';
    }
  }
}
