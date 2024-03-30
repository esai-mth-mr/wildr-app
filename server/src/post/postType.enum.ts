import { PostKind } from '@verdzie/server/generated-graphql';
import { PostType } from '@verdzie/server/post/data/post-type';

export const fromGqlPostKind = (gqlEnum: PostKind): PostType => {
  switch (gqlEnum) {
    case PostKind.TEXT:
      return PostType.TEXT;
    case PostKind.AUDIO:
      return PostType.AUDIO;
    case PostKind.VIDEO:
      return PostType.VIDEO;
    case PostKind.IMAGE:
      return PostType.IMAGE;
    case PostKind.MULTI_MEDIA:
      return PostType.COLLAGE;
  }
};

export const toGqlPostKind = (postType: PostType): PostKind => {
  switch (postType) {
    case PostType.AUDIO:
      return PostKind.AUDIO;
    case PostType.IMAGE:
      return PostKind.IMAGE;
    case PostType.TEXT:
      return PostKind.TEXT;
    case PostType.VIDEO:
      return PostKind.VIDEO;
    case PostType.COLLAGE:
      return PostKind.MULTI_MEDIA;
  }
};
