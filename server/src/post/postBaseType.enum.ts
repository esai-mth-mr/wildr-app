import { PostBaseType as GqlPostBaseType } from '@verdzie/server/generated-graphql';

export enum PostBaseType {
  POST = 1,
  REPOST = 2,
  STORY = 3,
  REPOST_STORY = 4,
}

export const fromGqlPostBaseType = (gqlEnum: GqlPostBaseType): PostBaseType => {
  switch (gqlEnum) {
    case GqlPostBaseType.POST:
      return PostBaseType.POST;
    case GqlPostBaseType.STORY:
      return PostBaseType.STORY;
    case GqlPostBaseType.REPOST:
      return PostBaseType.REPOST;
    case GqlPostBaseType.REPOST_STORY:
      return PostBaseType.REPOST_STORY;
  }
};

export const toGqlPostBaseType = (baseType: PostBaseType): GqlPostBaseType => {
  switch (baseType) {
    case PostBaseType.POST:
      return GqlPostBaseType.POST;
    case PostBaseType.REPOST:
      return GqlPostBaseType.REPOST;
    case PostBaseType.STORY:
      return GqlPostBaseType.STORY;
    case PostBaseType.REPOST_STORY:
      return GqlPostBaseType.REPOST_STORY;
  }
};
