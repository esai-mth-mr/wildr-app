import { kTakenDownAccountErrorStr } from '@verdzie/server/auth/constants';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ContentSegmentIO } from '@verdzie/server/content/content.io';
import {
  Image as GqlImage,
  ImageType,
  KeyValuePair,
  PaginationInput,
  SmartError,
} from '@verdzie/server/generated-graphql';
import { PostService } from '@verdzie/server/post/post.service';
import { FileProperties } from '@verdzie/server/post/postProperties';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import _ from 'lodash';
import { Logger } from 'winston';
import { ActivityStreamEntity } from './activity-stream/activity.stream.entity';
import { CommentEntity } from './comment/comment.entity';
import { FeedEntity } from './feed/feed.entity';
import { Post, User } from './graphql';
import { PostEntity } from './post/post.entity';
import { ReplyEntity } from './reply/reply.entity';
import { UserEntity } from './user/user.entity';

export const kSomethingWentWrong = 'Oops! Something went wrong.';

export const SomethingWentWrong = (message?: string): SmartError => ({
  __typename: 'SmartError',
  message: message ?? kSomethingWentWrong,
});

export interface WithTypename {
  __typename: string;
}

export interface AppContext {
  __typename: 'AppContext';
  req: any;
  input?: any;
  feed?: FeedEntity;
  activityStream?: ActivityStreamEntity;
  comment?: CommentEntity;
  user?: UserEntity;
  reply?: ReplyEntity;
  userToLookupFor?: User;
  posts: { [id: string]: PostEntity };
  feedPostEntries: Post[];
  comments: { [id: string]: CommentEntity };
  replies: { [id: string]: ReplyEntity };
  users: { [id: string]: UserEntity };
  timeStamp?: Date;
  hasBlockedUserToGet?: boolean;
  isAvailable?: boolean;
  repostParentPosts: { [id: string]: PostEntity | undefined };
  version?: string;
  timezoneOffset?: string;
  challenges: { [id: string]: ChallengeEntity };
  challengePinnedPosts: {
    [challengeId: string]: string[];
  };
  challengeInteractionData: {
    challenge: ChallengeEntity | undefined;
    interactionCount: number;
  };
}

export const newAppContext = (): AppContext => {
  return {
    __typename: 'AppContext',
    req: {},
    posts: {},
    feedPostEntries: [],
    comments: {},
    replies: {},
    users: {},
    repostParentPosts: {},
    challenges: {},
    challengePinnedPosts: {},
    challengeInteractionData: {
      challenge: undefined,
      interactionCount: 0,
    },
  };
};

export const isAppContext = (obj: any): obj is AppContext => {
  return obj && obj.__typename === 'AppContext';
};

export const toUrl = async (
  url: string,
  logger: Logger,
  s3UrlPresigner: S3UrlPreSigner,
  cdnPvtS3UrlPresigner: CDNPvtUrlSigner
): Promise<URL> => {
  const paths = url.split('/');
  if (paths.length === 5) {
    if (
      paths[3] === SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME
    ) {
      return Promise.resolve().then(
        () =>
          new URL(
            `https://${SSMParamsService.Instance.s3Params.AWS_CF_S3_DOMAIN!}/${
              paths[4]
            }`
          )
      );
    } else if (process.env.UPLOAD_CLIENT === 'local') {
      return new URL(
        `http://${process.env.SERVER_HTTP_HOST}:${process.env.SERVER_HTTP_PORT}/uploads/${paths[4]}`
      );
    } else if (
      paths[3] ===
      SSMParamsService.Instance.s3Params.AWS_S3_PVT_UPLOAD_BUCKET_NAME
    ) {
      return cdnPvtS3UrlPresigner.getSignedUrl(paths[4]).then(u => new URL(u));
    }
  }
  return s3UrlPresigner.presign(url).then(u => new URL(u));
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const delay = async (callback: Function, ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
  callback();
};

export const getDayDiff = (startDate: Date, endDate: Date): number => {
  const msInDay = 24 * 60 * 60 * 1000;

  // 👇️ explicitly calling getTime()
  return Math.round(
    Math.abs(endDate.getTime() - startDate.getTime()) / msInDay
  );
};

export const isSubset = <T>(a: T[], b: T[]) => a.every(v => b.includes(v));
export const takenDownAccountSmartError: SmartError = {
  __typename: 'SmartError',
  message: kTakenDownAccountErrorStr,
};

export const updateUserIdPageIndexMap = (
  userIdPageIndexMap: Map<string, number>,
  segments: ContentSegmentIO[],
  pageIndex: number
) => {
  segments.forEach(element => {
    const segment = element.segment;
    if (segment.type === 'UserSegmentIO') {
      if (!userIdPageIndexMap.has(segment.id)) {
        userIdPageIndexMap.set(segment.id, pageIndex);
      }
    }
  });
};

export const somethingWentWrongSmartError: SmartError = {
  __typename: 'SmartError',
  message: kSomethingWentWrong,
};

export const setupParentPostsForReposts = async (
  posts: PostEntity[],
  ctx: AppContext,
  postService: PostService,
  logger: Logger
) => {
  const parentPostIdsMap: Map<string, string> = new Map();
  for (const post of posts) {
    if (!post.isRepost()) {
      //since ctx.repostParentPosts is being used in post.resolver#repostMeta
      //regardless of parent post
      ctx.repostParentPosts[post.id] = post;
      continue;
    }
    if (!post.repostMeta) {
      logger.warn('RepostMeta not found for a Repost', {
        id: post.id,
      });
      if (ctx.posts[post.id]) {
        ctx.posts[post.id].repostMeta = {
          isParentPostDeleted: true,
        };
      }
      continue;
    }
    const parentPostId = post.repostMeta.parentPostId;
    if (post.repostMeta.isParentPostDeleted || !parentPostId) {
      logger.warn('RepostMeta parentPostDeleted or no parentPostId found', {
        id: post.id,
        parentPostId,
      });
      ctx.posts[post.id].repostMeta = {
        isParentPostDeleted: true,
      };
      continue;
    }
    parentPostIdsMap.set(post.id, parentPostId);
  }
  const parentPosts: PostEntity[] =
    (await postService.findByIds([...parentPostIdsMap.values()], {
      includeExpired: true,
    })) ?? [];
  for (const [repostId, parentPostId] of parentPostIdsMap) {
    const parentPost = _.find(
      parentPosts,
      postEntity => postEntity.id === parentPostId
    );
    if (parentPost) {
      ctx.repostParentPosts[repostId] = parentPost;
    } else {
      if (ctx.posts[repostId]) {
        ctx.posts[repostId].repostMeta = {
          isParentPostDeleted: true,
        };
      }
    }
  }
};

export async function retryWithBackoff<T>({
  fn,
  retryCount,
  throwAfterFailedRetries,
  logFailure,
}: {
  fn: () => Promise<T>;
  retryCount: number;
  throwAfterFailedRetries: boolean;
  logFailure?: (error: unknown) => void;
}): Promise<T | undefined> {
  let error;
  for (let i = 1; i < retryCount + 2; i++) {
    try {
      return await fn();
    } catch (e) {
      error = e;
      if (logFailure) {
        logFailure(e);
      }
    }
    await new Promise(resolve =>
      setTimeout(resolve, Math.pow(10, retryCount) + Math.random() * 1000)
    );
  }
  if (throwAfterFailedRetries) {
    throw error;
  }
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export const getImageType = (mimetype: string): ImageType => {
  switch (mimetype) {
    case 'image/png':
      return ImageType['PNG'];
    case 'image/jpg':
      return ImageType['JPEG'];
    case 'image/jpeg':
      return ImageType['JPEG'];
    case 'image/webp':
      return ImageType['WEBP'];
    default:
      return ImageType['JPEG'];
  }
};

export const toGqlImageObj = (imageFP: FileProperties): GqlImage => {
  return {
    __typename: 'Image',
    id: imageFP.id,
    type: getImageType(imageFP.type),
    source: {
      __typename: 'MediaSource',
      uri: imageFP.path,
    },
  };
};

export const isPaginationInputRefreshing = (
  input: PaginationInput
): boolean => {
  return (
    input.after === undefined &&
    input.before === undefined &&
    input.includingAndAfter === undefined &&
    input.includingAndBefore === undefined
  );
};

export function filterNonNullValues(obj: { [key: string]: any }): {
  [key: string]: any;
} {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
}

export function goOneDayBefore(date: Date): Date {
  date.setDate(date.getDate() - 1);
  return date;
}

export function goOneDayAhead(date: Date): Date {
  date.setDate(date.getDate() + 1);
  return date;
}

export function getStartAndEndDateInUTC(timezoneOffset: string): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = getClientStartTimeOfDayInUTC(timezoneOffset);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 24 * 1000 - 1);
  return {
    startDate,
    endDate,
  };
}

export function getClientStartTimeOfDayInUTC(offsetStr: string): Date {
  const utcTime = new Date(Date.now());
  // Split the offset string into hours and minutes
  const [hoursStr, minutesStr] = offsetStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  // Create a new date representing the start of the UTC day
  const utcStartOfDay = new Date();
  utcStartOfDay.setUTCHours(0, 0, 0, 0);
  const fixedDate = utcStartOfDay;
  if (hours == 0 && minutes === 0) {
    return utcStartOfDay;
  } else if (hours < 0) {
    utcStartOfDay.setUTCHours(fixedDate.getUTCHours() + Math.abs(hours));
    utcStartOfDay.setUTCMinutes(fixedDate.getUTCMinutes() + minutes);
    if (
      utcStartOfDay.getUTCHours() > utcTime.getUTCHours() ||
      (utcStartOfDay.getUTCHours() === utcTime.getUTCHours() &&
        utcStartOfDay.getMinutes() > utcTime.getUTCMinutes())
    ) {
      return goOneDayBefore(utcStartOfDay);
    }
  } else {
    utcStartOfDay.setUTCHours(fixedDate.getUTCHours() - hours);
    utcStartOfDay.setUTCMinutes(fixedDate.getUTCMinutes() - minutes);
    if (
      utcStartOfDay.getUTCHours() < utcTime.getUTCHours() ||
      (utcStartOfDay.getUTCHours() === utcTime.getUTCHours() &&
        utcStartOfDay.getMinutes() < utcTime.getUTCMinutes())
    ) {
      return goOneDayAhead(utcStartOfDay); //Already started
    }
  }
  return utcStartOfDay;
}

export const addDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const keyValuePairArrayToObject = (
  keyValuePairArray: KeyValuePair[]
) => {
  const obj: { [key: string]: string } = {};
  keyValuePairArray.forEach(keyValuePair => {
    obj[keyValuePair.key] = keyValuePair.value;
  });
  return obj;
};

export type Nullable<T> = T | null;
