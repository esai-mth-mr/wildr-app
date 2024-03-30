import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import {
  POST_EXPLORE_V1_INDEX_NAME,
  PostSnapshot,
  postIndexVersionConfig,
} from './post-index-version.config';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { In } from 'typeorm';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import {
  tagSegmentIOFake,
  userSegmentIOFake,
} from '@verdzie/server/content/testing/content-io.fake';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType, FeedPage } from '@verdzie/server/feed/feed.entity';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';
import {
  ImagePostPropertiesFake,
  TextPostPropertiesFake,
} from '@verdzie/server/post/testing/postProperties.fake';
import { SensitiveStatus } from '@verdzie/server/post/data/sensitive-status';

describe('postIndexVersionConfig', () => {
  it('should be defined', () => {
    expect(postIndexVersionConfig).toBeDefined();
  });

  describe('serializeRecord', () => {
    it('should return filtered post with author and pinned comment', async () => {
      const postEntity = PostEntityFake();
      const pinnedComment = CommentEntityFake({
        postId: postEntity.id,
      });
      postEntity.pinnedComment = pinnedComment;
      const postAuthor = UserEntityFake();
      postEntity.author = postAuthor;

      const postCommentFeed = FeedEntityFake();
      const postComments = new Array(10).fill(
        CommentEntityFake({
          postId: postEntity.id,
        })
      );
      postCommentFeed.ids = postComments.map(c => c.id);

      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(serializedPost.id).toEqual(postEntity.id);
      expect(serializedPost._stats).toEqual(postEntity._stats);
      expect(serializedPost.createdAt).toEqual(postEntity.createdAt);
      expect(serializedPost.updatedAt).toEqual(postEntity.updatedAt);
      expect(serializedPost.author).toEqual(postAuthor);
      expect(serializedPost.pinnedComment?._stats).toBeDefined();
    });

    it('should include the post categoryIds', async () => {
      const postEntity = PostEntityFake({ categoryIds: ['1', '2'] });
      const pinnedComment = CommentEntityFake({
        postId: postEntity.id,
      });
      postEntity.pinnedComment = pinnedComment;
      const postAuthor = UserEntityFake();
      postEntity.author = postAuthor;

      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(undefined),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(serializedPost.categoryIds).toEqual(postEntity.categoryIds);
    });

    it('should return a post with comments that have _stats and are defined', async () => {
      const postEntity = PostEntityFake();

      const postCommentFeed = FeedEntityFake();
      const postComments = new Array(120).fill(
        CommentEntityFake({
          postId: postEntity.id,
        })
      );
      postCommentFeed.ids = postComments.map(c => c.id);

      const commentRepo = {
        find: jest.fn().mockResolvedValue(postComments),
      };
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(postCommentFeed),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return feedRepo;
            } else if (entity.name === 'CommentEntity') {
              return commentRepo;
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const { comments } = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      const commentFeedId = toFeedId(FeedEntityType.COMMENT, postEntity.id);

      expect(comments).toHaveLength(120);
      comments.forEach(comment => {
        expect(comment._stats).toBeDefined();
      });
      expect(feedRepo.findOne).toHaveBeenCalledWith({
        where: { id: commentFeedId },
      });
      expect(commentRepo.find).toHaveBeenCalledWith({
        where: {
          id: In(postCommentFeed.ids.slice(0, 100)),
        },
      });
    });

    it('should get users mentioned in post caption', async () => {
      const postEntity = PostEntityFake();
      const mentionedUserId = '1';
      postEntity.caption = {
        segments: [
          {
            segment: userSegmentIOFake({ id: mentionedUserId }),
          },
        ],
      };
      const postCommentFeed = FeedEntityFake({ ids: [] });
      const mentionedUser = UserEntityFake({ id: mentionedUserId });
      const userRepo = {
        find: jest.fn().mockResolvedValue([mentionedUser]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return userRepo;
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(
        userRepo.find.mock.calls[0][0].where.id._value.includes(mentionedUserId)
      ).toBe(true);
      expect(serializedPost.usersMentionedInPost).toEqual([mentionedUser]);
    });

    it('should get tags mentioned in post caption', async () => {
      const postEntity = PostEntityFake();
      const mentionedTagId = '1';
      postEntity.caption = {
        segments: [
          {
            segment: tagSegmentIOFake({ id: mentionedTagId }),
          },
        ],
      };
      const postCommentFeed = FeedEntityFake({ ids: [] });
      const mentionedTag = {
        id: mentionedTagId,
        name: 'tag',
      };
      const tagsRepo = {
        find: jest.fn().mockResolvedValue([mentionedTag]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return tagsRepo;
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(
        tagsRepo.find.mock.calls[0][0].where.id._value.includes(mentionedTagId)
      ).toBe(true);
      expect(serializedPost.postTags).toEqual([mentionedTag]);
    });

    it('should get the tags mentioned in text post properties content', async () => {
      const postEntity = PostEntityFake();
      const mentionedTagId = '1';
      postEntity.multiPostProperties = [
        {
          type: 'TextPostProperties',
          content: {
            segments: [
              {
                segment: tagSegmentIOFake({ id: mentionedTagId }),
              },
            ],
          },
        },
      ];
      const mentionedTag = {
        id: mentionedTagId,
        name: 'tag',
      };
      const tagsRepo = {
        find: jest.fn().mockResolvedValue([mentionedTag]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue({ ids: [] }),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return tagsRepo;
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(
        tagsRepo.find.mock.calls[0][0].where.id._value.includes(mentionedTagId)
      ).toBe(true);
      expect(serializedPost.postTags).toEqual([mentionedTag]);
    });

    it('should get the users mentioned in text post properties content', async () => {
      const postEntity = PostEntityFake();
      const mentionedUserId = '1';
      postEntity.multiPostProperties = [
        {
          type: 'TextPostProperties',
          content: {
            segments: [
              {
                segment: userSegmentIOFake({ id: mentionedUserId }),
              },
            ],
          },
        },
      ];
      const mentionedUser = UserEntityFake({ id: mentionedUserId });
      const usersRepo = {
        find: jest.fn().mockResolvedValue([mentionedUser]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue({ ids: [] }),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return usersRepo;
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(
        usersRepo.find.mock.calls[0][0].where.id._value.includes(
          mentionedUserId
        )
      ).toBe(true);
      expect(serializedPost.usersMentionedInPost).toEqual([mentionedUser]);
    });

    it('should get users mentioned in comments', async () => {
      const postEntity = PostEntityFake();
      const mentionedUserId = '1';
      const postCommentFeed = FeedEntityFake();
      const postComments = [
        CommentEntityFake({
          postId: postEntity.id,
          content: {
            segments: [
              {
                segment: userSegmentIOFake({ id: mentionedUserId }),
              },
            ],
          },
        }),
      ];
      postCommentFeed.ids = postComments.map(c => c.id);

      const mentionedUser = UserEntityFake({ id: mentionedUserId });
      const userRepo = {
        find: jest.fn().mockResolvedValue([mentionedUser]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue(postComments),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return userRepo;
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(
        userRepo.find.mock.calls[0][0].where.id._value.includes(mentionedUserId)
      ).toBe(true);
      expect(serializedPost.usersMentionedInComments).toEqual([mentionedUser]);
    });

    it('should get tags mentioned in comments', async () => {
      const postEntity = PostEntityFake();
      postEntity.multiPostProperties = [];
      const mentionedTagId = '1';
      const postCommentFeed = FeedEntityFake();
      postCommentFeed.page.ids = [mentionedTagId];
      const postComments = [
        CommentEntityFake({
          content: {
            segments: [
              {
                segment: tagSegmentIOFake({ id: mentionedTagId }),
              },
            ],
          },
        }),
      ];

      const mentionedTag = {
        id: mentionedTagId,
        name: 'potatoes',
      };
      const tagRepo = {
        find: jest.fn().mockResolvedValue([mentionedTag]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue(postComments),
              };
            } else if (entity.name === 'TagEntity') {
              return tagRepo;
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(tagRepo.find).toHaveBeenCalledWith({
        where: {
          id: In([mentionedTagId]),
        },
      });
      expect(serializedPost.commentTags).toEqual([mentionedTag]);
    });

    it('should get comment authors', async () => {
      const postEntity = PostEntityFake();
      postEntity.multiPostProperties = [];
      const commentAuthorId = '2';
      const postCommentFeed = FeedEntityFake();
      const postComments = [
        CommentEntityFake({
          authorId: commentAuthorId,
          content: {
            segments: [], // Make sure there are no mentioned users
          },
        }),
      ];
      postCommentFeed.ids = postComments.map(c => c.id);

      const commentAuthor = UserEntityFake({ id: commentAuthorId });
      const userRepo = {
        find: jest.fn().mockResolvedValue([commentAuthor]),
      };
      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue(postComments),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return userRepo;
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(userRepo.find).toHaveBeenCalledWith({
        where: {
          id: In([commentAuthorId]),
        },
      });
      expect(serializedPost.commentAuthors).toEqual([commentAuthor]);
    });

    it('should serialize to an object that does not exceed 200KiB', async () => {
      const postEntity = PostEntityFake();
      const authorOfComments = UserEntityFake();
      const mentionedUser = UserEntityFake();
      const mentionedTagId = '1';
      const postComments = new Array(100).fill(
        CommentEntityFake({
          postId: postEntity.id,
          authorId: authorOfComments.id,
          content: {
            segments: [
              {
                segment: userSegmentIOFake({ id: authorOfComments.id }),
              },
              {
                segment: tagSegmentIOFake({ id: mentionedTagId }),
              },
            ],
          },
        })
      );
      const postCommentFeed = FeedEntityFake({
        page: {
          ids: postComments.map(c => c.id),
        } as FeedPage,
      });
      const commentAuthors = new Array(100).fill(authorOfComments);
      const usersMentionedInComments = new Array(100).fill(mentionedUser);
      const tagsMentionedInComments = new Array(100).fill({
        id: mentionedTagId,
        name: 'potatoes',
      });

      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(postCommentFeed),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue(postComments),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue(tagsMentionedInComments),
              };
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest
                  .fn()
                  .mockResolvedValue([
                    ...commentAuthors,
                    ...usersMentionedInComments,
                  ]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(serializedPost.commentAuthors.length).toBe(100);
      expect(serializedPost.usersMentionedInComments.length).toBe(100);
      expect(serializedPost.commentTags.length).toBe(100);
      expect(serializedPost.comments.length).toBe(100);
      expect(Buffer.byteLength(JSON.stringify(serializedPost))).toBeLessThan(
        200_000
      );
    });

    it('should not throw if comment feed is not found', async () => {
      const postEntity = PostEntityFake();

      const postRepo = {
        findOneOrFail: jest.fn().mockResolvedValue(postEntity),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity.name === 'FeedEntity') {
              return {
                findOne: jest.fn().mockResolvedValue(undefined),
              };
            } else if (entity.name === 'CommentEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'TagEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            } else if (entity.name === 'UserEntity') {
              return {
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        },
      };

      const serializedPost = await postIndexVersionConfig.serializeRecord(
        postEntity.id,
        postRepo as any
      );

      expect(serializedPost.comments).toEqual([]);
      expect(serializedPost.commentAuthors).toEqual([]);
      expect(serializedPost.usersMentionedInComments).toEqual([]);
      expect(serializedPost.commentTags).toEqual([]);
    });
  });

  describe('post_search_v1', () => {
    describe('getOSDoc', () => {
      const version = postIndexVersionConfig.indexVersions.find(v => {
        return v.name === 'post_search_v1';
      });
      if (!version) throw new Error('Version not found');

      const serializedPost = {
        caption: {
          segments: [
            {
              segment: {
                type: 'TextSegmentIO',
                chunk: 'caption_chunk',
              },
            },
          ],
        },
        multiPostProperties: [
          {
            type: 'TextPostProperties',
            content: {
              segments: [
                {
                  segment: {
                    type: 'TextSegmentIO',
                    chunk: 'multi_post_properties_chunk',
                  },
                },
              ],
            },
          },
        ],
        author: {
          handle: 'author_handle',
          name: 'author name',
          _stats: {
            followerCount: 5,
          },
        },
        _stats: {
          likeCount: 1,
        },
        wildrBoost: 1,
        postTags: [
          {
            id: '1',
            name: 'post_tag_1',
          },
        ],
        usersMentionedInPost: [
          {
            handle: 'user_mentioned_in_post_handle',
          },
        ],
        comments: [
          {
            content: {
              segments: [
                {
                  segment: {
                    type: 'TextSegmentIO',
                    chunk: ' comment_chunk',
                  },
                },
              ],
            },
          },
        ],
        commentTags: [
          {
            id: '2',
            name: ' comment_tag_1',
          },
        ],
        commentAuthors: [
          {
            handle: 'comment_author_handle ',
          },
        ],
        usersMentionedInComments: [
          {
            handle: 'user_mentioned_in_comment_handle',
          },
        ],
      } as any;

      it('should return a document with fields that match mapping', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc).toBeDefined();
        const mapping = version.getMapping();
        const mappingKeys = Object.keys(mapping.mappings.properties as any);
        // @ts-expect-error
        const osDocKeys = Object.keys(osDoc);
        expect(mappingKeys).toEqual(osDocKeys);
      });

      it('should add correct author handle to osDoc', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.author_handle).toBe(serializedPost.author.handle);
      });

      it('should add author name', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.author_name).toBe(serializedPost.author.name);
      });

      it('should add author followers count', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.author_followers_count).toBe(
          serializedPost.author._stats.followersCount
        );
      });

      it('should add all mentioned tag names to tags', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.tags).toEqual('post_tag_1 comment_tag_1 ');
      });

      it('should add all referenced user handles to referenced_users', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.referenced_users).toEqual(
          'user_mentioned_in_post_handle comment_author_handle user_mentioned_in_comment_handle '
        );
      });

      it('should add all comment content to comment_content', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.comment_content).toEqual('comment_chunk ');
      });

      it('should add post caption or text post properties to post_content', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.post_content).toEqual(
          'caption_chunk multi_post_properties_chunk '
        );
      });

      it('should add the reaction count', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.reaction_count).toEqual(serializedPost._stats.likeCount);
      });

      it('should add the wildr boost', () => {
        const osDoc = version.getOSDoc(serializedPost as any);
        expect(osDoc?.wildr_boost).toEqual(serializedPost.wildrBoost);
      });
    });
  });

  describe(POST_EXPLORE_V1_INDEX_NAME, () => {
    describe('getOSDoc', () => {
      const version = postIndexVersionConfig.indexVersions.find(v => {
        return v.name === POST_EXPLORE_V1_INDEX_NAME;
      });

      it('should filer out posts that start with a text post', () => {
        const serializedPost = {
          multiPostProperties: [TextPostPropertiesFake()],
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out REPOSTs', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          baseType: PostBaseType.REPOST,
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out repost stories', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          baseType: PostBaseType.STORY,
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out un-categorized posts', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          categoryIds: [],
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out posts without allowed categories', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          categoryIds: ['1'],
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out private posts', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          isPrivate: true,
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should filter out posts with sensitive content', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          sensitiveStatus: SensitiveStatus.NSFW,
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeUndefined();
      });

      it('should return a document with fields that match mapping', () => {
        const serializedPost = {
          multiPostProperties: [ImagePostPropertiesFake()],
          categoryIds: ['banana'], // category set in test.env
        } as Partial<PostSnapshot>;
        const osDoc = version?.getOSDoc(serializedPost as any);
        expect(osDoc).toBeDefined();
        const mapping = version?.getMapping();
        const mappingKeys = Object.keys(mapping?.mappings.properties as any);
        // @ts-expect-error
        const osDocKeys = Object.keys(osDoc);
        expect(mappingKeys.sort()).toEqual(osDocKeys.sort());
      });
    });

    describe('getMapping', () => {
      it('should return a mapping with fields that match the osDoc', () => {
        const version = postIndexVersionConfig.indexVersions.find(v => {
          return v.name === POST_EXPLORE_V1_INDEX_NAME;
        });
        const mapping = version?.getMapping();
        expect(mapping).toBeDefined();
        const mappingKeys = Object.keys(mapping?.mappings.properties as any);
        expect(mappingKeys.sort()).toEqual(
          [
            'wildr_boost',
            'comment_count',
            'reaction_count',
            'created_at',
          ].sort()
        );
      });
    });
  });
});
