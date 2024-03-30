enum PostBaseType { POST, STORY, REPOST, REPOST_STORY }

PostBaseType postBaseTypeFromGqlPostBaseType(String? type) {
  switch (type) {
    case 'STORY':
      return PostBaseType.STORY;
    case 'REPOST':
      return PostBaseType.REPOST;
    case 'REPOST_STORY':
      return PostBaseType.REPOST_STORY;
    default:
      return PostBaseType.POST;
  }
}
