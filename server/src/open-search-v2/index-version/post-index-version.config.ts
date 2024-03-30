import { PostEntity } from '@verdzie/server/post/post.entity';
import { IndexVersionConfig } from './index-version.service';
import { In, Repository } from 'typeorm';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { TagEntity } from '@verdzie/server/tag/tag.entity';
import _ from 'lodash';
import { isTextPostProperties } from '@verdzie/server/post/postProperties';
import { FilteredUser, filterUser } from './user-index-version.config';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';
import { SensitiveStatus } from '@verdzie/server/post/data/sensitive-status';

type FilteredPost = Omit<
  PostEntity,
  | 'pinnedComment'
  | 'stats'
  | 'existenceState'
  | 'incrementReaction'
  | 'decrementReaction'
  | 'setReactionCount'
  | 'isRepost'
  | 'isParentPostDeleted'
  | 'incrementLikes'
  | 'decrementLikes'
  | 'incrementReposts'
  | 'incrementShares'
  | 'incrementReportCount'
  | 'decrementReportCount'
  | 'objectType'
  | 'getBaseType'
>;

type FilteredComment = Omit<
  CommentEntity,
  | 'post'
  | 'replyFeed'
  | 'stats'
  | 'activityData'
  | 'existenceState'
  | 'incrementLikes'
  | 'decrementLikes'
  | 'incrementReportCount'
  | 'decrementReportCount'
  | 'setParticipationType'
  | 'getParticipationType'
  | 'softDelete'
  | 'objectType'
>;

export type PostSnapshot = FilteredPost & {
  wildrBoost: number;
  /**
   * Tags of post
   */
  postTags: TagEntity[];
  /**
   * Users mentioned in post
   */
  usersMentionedInPost: FilteredUser[];
  /**
   * First 100 comments
   */
  comments: FilteredComment[];
  /**
   * Tags of first 100 comments
   */
  commentTags: TagEntity[];
  /**
   * Authors of first 100 comments
   */
  commentAuthors: FilteredUser[];
  /**
   * Users mentioned in first 100 comments
   */
  usersMentionedInComments: FilteredUser[];
  /**
   * Pinned comment
   */
  pinnedComment?: FilteredComment;
};

function filterComment(comment: CommentEntity): FilteredComment {
  const {
    author,
    post,
    replyFeed,
    stats,
    activityData,
    existenceState,
    incrementLikes,
    decrementLikes,
    incrementReportCount,
    decrementReportCount,
    setParticipationType,
    getParticipationType,
    softDelete,
    objectType,
    ...filteredCommentEntity
  } = comment;

  return filteredCommentEntity;
}

export const POST_SEARCH_V1_INDEX_NAME = 'post_search_v1';
export const POST_EXPLORE_V1_INDEX_NAME = 'post_explore_v1';

export const postIndexVersionConfig: IndexVersionConfig<
  PostEntity,
  PostSnapshot
> = {
  entityType: PostEntity,
  serializeRecord: async (
    id: string,
    postRepo: Repository<PostEntity>
  ): Promise<PostSnapshot> => {
    // Retrieve post with pinned comment and author, and first page of comment
    // feed concurrently
    const commentFeedId = toFeedId(FeedEntityType.COMMENT, id);
    const [post, commentPage] = await Promise.all([
      postRepo.findOneOrFail(id, {
        relations: [
          PostEntity.kPinnedCommentRelation,
          PostEntity.kAuthorRelation,
        ],
      }),
      postRepo.manager.getRepository(FeedEntity).findOne({
        where: { id: commentFeedId },
      }),
    ]);
    // Make request for first 100 comments before post parse to reduce latency
    const commentIds = commentPage?.ids.slice(0, 100) ?? [];
    let commentsPromise: Promise<CommentEntity[]> | undefined;
    if (commentIds.length > 0) {
      commentsPromise = postRepo.manager.getRepository(CommentEntity).find({
        where: { id: In(commentIds) },
      });
    }
    // Parse post to get tags, and referenced users
    const postTagIds = new Set<string>();
    const userIdsMentionedInPost = new Set<string>();
    post.multiPostProperties.forEach(property => {
      if (isTextPostProperties(property)) {
        property.content.segments.forEach(segment => {
          switch (segment.segment?.type) {
            case 'TagSegmentIO':
              postTagIds.add(segment.segment.id);
              break;
            case 'UserSegmentIO':
              userIdsMentionedInPost.add(segment.segment.id);
              break;
          }
        });
      }
    });
    if (post.caption) {
      post.caption.segments.forEach(segment => {
        switch (segment.segment?.type) {
          case 'TagSegmentIO':
            postTagIds.add(segment.segment.id);
            break;
          case 'UserSegmentIO':
            userIdsMentionedInPost.add(segment.segment.id);
            break;
        }
      });
    }
    // Parse comments to get tags, authors, and referenced users
    const comments = await commentsPromise;
    const commentTagIds = new Set<string>();
    const commentAuthorIds = new Set<string>();
    const usersMentionedInCommentsIds = new Set<string>();
    if (comments) {
      for (const comment of comments) {
        for (const segment of comment.content.segments) {
          switch (segment.segment?.type) {
            case 'TagSegmentIO':
              commentTagIds.add(segment.segment.id);
              break;
            case 'UserSegmentIO':
              usersMentionedInCommentsIds.add(segment.segment.id);
              break;
          }
        }
        commentAuthorIds.add(comment.authorId);
      }
    }

    // Combine all tag and user ids for single query
    const allTagIds = [...postTagIds, ...commentTagIds];
    const allUserIds = [
      ...usersMentionedInCommentsIds,
      ...userIdsMentionedInPost,
      ...commentAuthorIds,
    ];
    // Concurrently fetch all tags and users
    const [tags, users] = await Promise.all([
      postRepo.manager.getRepository(TagEntity).find({
        where: { id: In(allTagIds) },
      }),
      postRepo.manager.getRepository(UserEntity).find({
        where: { id: In(allUserIds) },
      }),
    ]);
    // Organize and filter tags
    const postTags = tags.filter(t => postTagIds.has(t.id));
    const commentTags = tags.filter(t => commentTagIds.has(t.id));
    // Organize and filter users
    const filteredUsers = users.map(filterUser);
    const usersMentionedInPost = filteredUsers.filter(u =>
      userIdsMentionedInPost.has(u.id)
    );
    const commentAuthors = filteredUsers.filter(u =>
      commentAuthorIds.has(u.id)
    );
    const usersMentionedInComments = filteredUsers.filter(u =>
      usersMentionedInCommentsIds.has(u.id)
    );

    return {
      ...post,
      wildrBoost: 1,
      postTags,
      usersMentionedInPost,
      comments: comments?.map(filterComment) ?? [],
      commentTags,
      commentAuthors,
      usersMentionedInComments,
      pinnedComment: post.pinnedComment
        ? filterComment(post.pinnedComment)
        : undefined,
    };
  },
  indexVersions: [
    {
      name: POST_SEARCH_V1_INDEX_NAME,
      entityType: PostEntity,
      incrementalIndex: true,
      getOSDoc: (postSnapshot: PostSnapshot) => {
        // Get text blob of text in comments
        const comment_content = postSnapshot.comments.reduce(
          (text, comment) => {
            for (const segment of comment?.content?.segments) {
              if (segment?.segment?.type === 'TextSegmentIO') {
                text += segment.segment.chunk.trim() + ' ';
              }
            }
            return text;
          },
          ''
        );
        // Get text blob of tag names
        const tags = postSnapshot.postTags
          .concat(postSnapshot.commentTags)
          .reduce((acc, tag) => {
            acc += tag.name.trim() + ' ';
            return acc;
          }, '');
        // Get text blob of referenced user handles
        const referenced_users = postSnapshot.usersMentionedInPost
          .concat(postSnapshot.commentAuthors)
          .concat(postSnapshot.usersMentionedInComments)
          .reduce((acc, user) => {
            acc += user.handle.trim() + ' ';
            return acc;
          }, '');
        // Get text blob of text within post
        let post_content = '';
        if (postSnapshot.caption) {
          post_content += postSnapshot?.caption?.segments.reduce(
            (acc, segment) => {
              if (segment?.segment?.type === 'TextSegmentIO') {
                acc += segment.segment.chunk.trim() + ' ';
              }
              return acc;
            },
            ''
          );
        }
        if (postSnapshot.multiPostProperties) {
          postSnapshot.multiPostProperties.forEach(property => {
            if (isTextPostProperties(property)) {
              property?.content?.segments.forEach(segment => {
                if (segment?.segment?.type === 'TextSegmentIO') {
                  post_content += segment.segment.chunk.trim() + ' ';
                }
              });
            }
          });
        }

        return {
          author_name: postSnapshot.author?.name ?? '',
          author_handle: postSnapshot.author?.handle ?? '',
          author_follower_count:
            postSnapshot.author?._stats?.followerCount ?? 0,
          tags,
          post_content,
          comment_content,
          referenced_users,
          created_at: postSnapshot.createdAt,
          reaction_count: postSnapshot?._stats?.likeCount ?? 0,
          wildr_boost: postSnapshot.wildrBoost,
        };
      },
      getQuery: (search: string) => {
        const query = search
          ? {
              multi_match: {
                query: search,
                type: 'bool_prefix',
                fields: [
                  'author_name^5',
                  'author_handle^5',
                  'tags^3',
                  'post_content^2',
                  'comment_content',
                  'referenced_users',
                ],
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
                script_score: {
                  script: {
                    source: 'Math.log(1 + doc["author_follower_count"].value)',
                  },
                },
              },
              {
                script_score: {
                  script: {
                    source: 'Math.log(1 + doc["reaction_count"].value)',
                  },
                },
              },
              {
                gauss: {
                  created_at: {
                    origin: 'now',
                    scale: '30d',
                    decay: 0.5,
                  },
                },
              },
            ],
            score_mode: 'multiply',
          },
        };
      },
      getMapping: () => {
        return {
          settings: {
            analysis: {
              analyzer: {
                author_handle_analyzer: {
                  type: 'custom',
                  tokenizer: 'author_handle_tokenizer',
                  filter: ['lowercase'],
                },
                tag_analyzer: {
                  type: 'custom',
                  tokenizer: 'tag_tokenizer',
                  filter: ['lowercase'],
                },
              },
              tokenizer: {
                author_handle_ngram: {
                  type: 'ngram',
                  min_gram: 2,
                  max_gram: 3,
                },
                author_handle_tokenizer: {
                  type: 'char_group',
                  tokenize_on_chars: ['whitespace', '-', '_', '.'],
                },
                tag_ngram: {
                  type: 'ngram',
                  min_gram: 2,
                  max_gram: 3,
                },
                tag_tokenizer: {
                  type: 'char_group',
                  tokenize_on_chars: ['_'],
                },
              },
            },
          },
          mappings: {
            properties: {
              author_name: {
                type: 'text',
              },
              author_handle: {
                type: 'text',
                analyzer: 'author_handle_analyzer',
                search_analyzer: 'author_handle_analyzer',
              },
              author_follower_count: {
                type: 'integer',
              },
              tags: {
                type: 'text',
                analyzer: 'tag_analyzer',
                search_analyzer: 'tag_analyzer',
              },
              post_content: {
                type: 'text',
              },
              comment_content: {
                type: 'text',
              },
              referenced_users: {
                type: 'text',
              },
              created_at: {
                type: 'date',
              },
              reaction_count: {
                type: 'integer',
              },
              wildr_boost: {
                type: 'integer',
              },
            },
          },
        };
      },
    },
    {
      name: POST_EXPLORE_V1_INDEX_NAME,
      entityType: PostEntity,
      incrementalIndex: true,
      getOSDoc: (postSnapshot: PostSnapshot) => {
        // Filter out posts that will have a preview of a text post
        if (
          postSnapshot?.multiPostProperties?.[0]?.type === 'TextPostProperties'
        ) {
          return;
        }
        if (
          postSnapshot.baseType === PostBaseType.REPOST ||
          postSnapshot.baseType === PostBaseType.REPOST_STORY ||
          postSnapshot.baseType === PostBaseType.STORY
        ) {
          return;
        }
        if (postSnapshot.sensitiveStatus === SensitiveStatus.NSFW) {
          return;
        }
        if (
          !postSnapshot.categoryIds ||
          postSnapshot.categoryIds.length === 0
        ) {
          return;
        }
        const allowedCategories =
          SSMParamsService?.Instance?.openSearchParams
            ?.OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS ?? [];
        const allowedCategoryIds = new Set(allowedCategories);
        const matchingCategoryIds = postSnapshot.categoryIds.filter(id =>
          allowedCategoryIds.has(id)
        );
        if (!matchingCategoryIds.length) {
          return;
        }
        if (postSnapshot.isPrivate) {
          return;
        }
        return {
          wildr_boost: postSnapshot.wildrBoost,
          comment_count: postSnapshot?._stats?.commentCount ?? 0,
          reaction_count: postSnapshot?._stats?.likeCount ?? 0,
          created_at: postSnapshot.createdAt,
        };
      },
      getQuery: () => {
        return {
          function_score: {
            query: {
              match_all: {},
            },
            functions: [
              {
                script_score: {
                  script: {
                    source: 'Math.max(2, doc["wildr_boost"].value)',
                  },
                },
              },
              {
                script_score: {
                  script: {
                    source: 'Math.log(2 + doc["comment_count"].value)',
                  },
                },
              },
              {
                script_score: {
                  script: {
                    source: 'Math.log(2 + doc["reaction_count"].value)',
                  },
                },
              },
              {
                gauss: {
                  created_at: {
                    origin: 'now',
                    offset: '1d',
                    scale: '7d',
                    decay: 0.5,
                  },
                },
              },
            ],
            score_mode: 'multiply',
            min_score: 0,
          },
        };
      },
      getMapping: () => {
        return {
          mappings: {
            properties: {
              wildr_boost: {
                type: 'integer',
              },
              comment_count: {
                type: 'integer',
              },
              reaction_count: {
                type: 'integer',
              },
              created_at: {
                type: 'date',
              },
            },
          },
        };
      },
    },
  ],
};
