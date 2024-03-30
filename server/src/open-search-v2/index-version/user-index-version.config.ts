import { UserEntity, UserEntityStats } from '@verdzie/server/user/user.entity';
import { IndexVersionConfig } from './index-version.service';
import { Repository } from 'typeorm';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';

export type FilteredUser = Omit<
  UserEntity,
  | 'password'
  | 'followerFeed'
  | 'likeReactionOnPostFeed'
  | 'realReactionOnPostFeed'
  | 'applaudReactionOnPostFeed'
  | 'reportCommentFeed'
  | 'reportReplyFeed'
  | 'reportPostFeed'
  | 'blockListFeed'
  | 'activityStream'
  | 'setPassword'
  | 'checkPassword'
  | 'stats'
  | 'isTakenDown'
  | 'isAlive'
  | 'existenceState'
  | 'updateTotalScore'
  | 'objectType'
  | 'archiveCurrentScore'
  | 'updateScore'
  | 'addStrike'
  | 'addSuspension'
  | 'getStats'
  | 'setStats'
  | 'getComputedStats'
  | 'incrementPostCount'
  | 'decrementPostCount'
  | 'incrementFollowerCount'
  | 'decrementFollowerCount'
  | 'incrementFollowingCount'
  | 'decrementFollowingCount'
  | 'incrementInnerCircleCount'
  | 'decrementInnerCircleCount'
  | 'joinWildrCoinWaitlist'
  | 'isOnWildrCoinWaitlist'
  | 'skipBanner'
  | 'completeBanner'
  | 'addLinkData'
>;

export type BackwardsCompatibleFilteredUser = FilteredUser & {
  _stats: UserEntityStats;
};

export function filterUser(user: UserEntity): BackwardsCompatibleFilteredUser {
  const {
    password,
    followerFeed,
    likeReactionOnPostFeed,
    realReactionOnPostFeed,
    applaudReactionOnPostFeed,
    reportCommentFeed,
    reportReplyFeed,
    reportPostFeed,
    blockListFeed,
    activityStream,
    ...filteredUserEntity
  } = user;

  return {
    ...filteredUserEntity,
    _stats: user.getStats(),
  };
}

export type UserSnapshot = BackwardsCompatibleFilteredUser & {
  __typename: 'UserSnapshot';
  wildr_boost: number;
  userCategoryInterestsFeedId: string;
  userFollowerFeedId: string;
  userFollowingFeedId: string;
  userLikeReactionOnPostFeedId: string;
};

export function isUserSnapshot(entity: any): entity is UserSnapshot {
  return entity.__typename === 'UserSnapshot';
}

export const USER_RECENTLY_CREATED_INDEX_NAME = 'recently_created_users_v1';
export const USER_SEARCH_V1_INDEX_NAME = 'user_search_v1';

const PROFILE_PICTURE_FIELD = 'profile_picture';
const CREATED_AT_FIELD = 'created_at';

export const userIndexVersionConfig: IndexVersionConfig<
  UserEntity,
  UserSnapshot
> = {
  entityType: UserEntity,
  serializeRecord: async (
    id: string,
    repo: Repository<UserEntity>
  ): Promise<UserSnapshot> => {
    const userEntity = await repo.findOneOrFail(id);
    return {
      __typename: 'UserSnapshot',
      ...filterUser(userEntity),
      userCategoryInterestsFeedId: toFeedId(
        FeedEntityType.USER_CATEGORY_INTERESTS,
        id
      ),
      userFollowerFeedId: toFeedId(FeedEntityType.FOLLOWER, id),
      userFollowingFeedId: toFeedId(FeedEntityType.FOLLOWING, id),
      userLikeReactionOnPostFeedId: toFeedId(
        FeedEntityType.LIKE_REACTIONS_ON_POST,
        id
      ),
      wildr_boost: 1,
    };
  },
  indexVersions: [
    {
      name: USER_SEARCH_V1_INDEX_NAME,
      entityType: UserEntity,
      incrementalIndex: true,
      getMapping: () => ({
        settings: {
          analysis: {
            analyzer: {
              handle_analyzer: {
                type: 'custom',
                tokenizer: 'handle_tokenizer',
                filter: ['lowercase'],
              },
            },
            tokenizer: {
              handle_ngram: {
                type: 'ngram',
                min_gram: 2,
                max_gram: 3,
              },
              handle_tokenizer: {
                type: 'char_group',
                tokenize_on_chars: ['whitespace', '-', '_', '.'],
              },
            },
          },
        },
        mappings: {
          properties: {
            handle: {
              type: 'text',
              analyzer: 'handle_analyzer',
              search_analyzer: 'handle_analyzer',
            },
            name: {
              type: 'text',
            },
            bio: {
              type: 'text',
            },
            updated_at: {
              type: 'date',
              format: 'date_time',
            },
            follower_count: {
              type: 'integer',
            },
            wildr_boost: {
              type: 'integer',
            },
            profile_picture: {
              type: 'boolean',
            },
          },
        },
      }),
      getQuery: (search: string) => {
        const query = search
          ? {
              multi_match: {
                query: search,
                type: 'bool_prefix',
                fields: ['handle^5', 'name^5'],
              },
            }
          : {
              match_all: {},
            };

        return {
          function_score: {
            query,
            functions: [
              {
                field_value_factor: {
                  field: 'wildr_boost',
                  factor: 1,
                  missing: 1,
                },
              },
              {
                script_score: {
                  script: {
                    source: 'Math.log(1 + doc["follower_count"].value)',
                  },
                },
              },
              {
                field_value_factor: {
                  field: 'profile_picture',
                  factor: 5,
                  missing: 1,
                },
              },
            ],
            score_mode: 'sum',
            boost_mode: 'sum',
          },
        };
      },
      getOSDoc(serializedUserEntity: UserSnapshot) {
        return {
          handle: serializedUserEntity.handle,
          name: serializedUserEntity.name,
          bio: serializedUserEntity.bio || '',
          updated_at: serializedUserEntity.updatedAt,
          follower_count: serializedUserEntity._stats.followerCount || 0,
          wildr_boost: serializedUserEntity.wildr_boost,
          profile_picture: !!serializedUserEntity.avatarImage,
        };
      },
    },
    {
      name: USER_RECENTLY_CREATED_INDEX_NAME,
      entityType: UserEntity,
      incrementalIndex: true,
      getMapping: () => ({
        mappings: {
          properties: {
            [CREATED_AT_FIELD]: {
              type: 'date',
              format: 'date_time',
            },
            [PROFILE_PICTURE_FIELD]: {
              type: 'boolean',
            },
          },
        },
      }),
      getQuery: () => {
        return {
          bool: {
            filter: [{ term: { [PROFILE_PICTURE_FIELD]: true } }],
          },
        };
      },
      getSort: () => {
        return {
          [CREATED_AT_FIELD]: 'desc',
        };
      },
      getOSDoc(serializedUserEntity: UserSnapshot) {
        return {
          [CREATED_AT_FIELD]: serializedUserEntity.createdAt,
          [PROFILE_PICTURE_FIELD]: !!serializedUserEntity.avatarImage,
        };
      },
    },
  ],
};
