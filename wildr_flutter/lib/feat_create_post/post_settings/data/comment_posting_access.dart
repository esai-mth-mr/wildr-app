enum CommentPostingAccess {
  NONE,
  EVERYONE,
  FOLLOWERS,
  INNER_CIRCLE,
  LIST,
}

CommentPostingAccess fromGqlCommentPostingAccess(String? value) {
  switch (value) {
    case 'EVERYONE':
      return CommentPostingAccess.EVERYONE;
    case 'FOLLOWERS':
      return CommentPostingAccess.FOLLOWERS;
    case 'INNER_CIRCLE':
      return CommentPostingAccess.INNER_CIRCLE;
    case 'LIST':
      return CommentPostingAccess.LIST;
    default:
      return CommentPostingAccess.NONE;
  }
}

extension CommentPostingAccessExt on CommentPostingAccess {
  String toViewString() {
    switch (this) {
      case CommentPostingAccess.EVERYONE:
        return 'Everyone';
      case CommentPostingAccess.FOLLOWERS:
        return 'Followers';
      case CommentPostingAccess.INNER_CIRCLE:
        return 'Inner Circle';
      case CommentPostingAccess.LIST:
        return 'List';
      case CommentPostingAccess.NONE:
        return 'None';
    }
  }
}
