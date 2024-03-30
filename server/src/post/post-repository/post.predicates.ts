import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';
import { FindConditions, Raw } from 'typeorm';

export const ignoreInnerCirclePostsPredicate: FindConditions<PostEntity> = {
  accessControl: Raw(
    access_control =>
      `(${access_control} -> 'postVisibilityAccessData' != '{"access": 4}' OR ${access_control} IS NULL)`
  ),
};
export const ignoreRepostsPredicate: FindConditions<PostEntity> = {
  baseType: Raw(
    base_type =>
      `(${base_type} NOT IN (${PostBaseType.REPOST}, ${PostBaseType.REPOST_STORY}) OR ${base_type} IS NULL)`
  ),
};
