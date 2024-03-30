import { newAppContext } from '@verdzie/server/common';
import { FeedEntityType, FeedPage } from '@verdzie/server/feed/feed.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { DEFAULT_PAGE_SIZE } from '@verdzie/server/open-search-v2/query/query.service';
import { PostSearchService } from '@verdzie/server/post/post-search.service';
import {
  PostAccessControl,
  PostVisibilityAccess,
} from '@verdzie/server/post/postAccessControl';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe('PostSearchService', () => {
  let service: PostSearchService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [PostSearchService],
    });
    service = module.get<PostSearchService>(PostSearchService);
  });

  describe('searchForPosts', () => {
    it('should return posts found from search and filtered for the current user', async () => {
      const postIds = [1, 2, 3];
      const context = newAppContext();
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsForCurrentUser'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const currentUser = UserEntityFake();
      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {},
        currentUser,
        context,
      });
      expect(result).toEqual(posts);
      expect(
        service['openSearchQueryService'].searchPostsAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {},
      });
      expect(service['postService'].findAllNonExpired).toBeCalledWith(postIds);
      expect(service['filterHiddenPostsForCurrentUser']).toBeCalledWith(
        posts,
        currentUser
      );
    });

    it('should return the take amount', async () => {
      const postIds = [1, 2, 3];
      const context = newAppContext();
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsForCurrentUser'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const currentUser = UserEntityFake();

      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {
          take: 2,
        },
        currentUser,
        context,
      });

      expect(result).toEqual(posts.slice(0, 2));
    });

    it('should return the default page size if take is not provided', async () => {
      const postIds = [1, 2, 3];
      const context = newAppContext();
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsForCurrentUser'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const currentUser = UserEntityFake();
      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {},
        currentUser,
        context,
      });
      expect(result).toEqual(posts.slice(0, DEFAULT_PAGE_SIZE));
    });

    it('should filter for non authenticated users if the user is not provided', async () => {
      const postIds = [1, 2, 3];
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsWithoutAuth'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {},
        context: newAppContext(),
      });
      expect(result).toEqual(posts);
      expect(service['filterHiddenPostsWithoutAuth']).toBeCalledWith(posts);
    });

    it('should search with twice the take value to allow for filtering', async () => {
      const postIds = [1, 2, 3, 4];
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsWithoutAuth'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {
          take: 2,
          after: 'after',
        },
        context: newAppContext(),
      });
      expect(result).toEqual(posts.slice(0, 2));
      expect(
        service['openSearchQueryService'].searchPostsAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 4,
          after: 'after',
        },
      });
    });

    it('should take from the end of result during reverse pagination', async () => {
      const postIds = [1, 2, 3, 4];
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue(postIds);
      const posts = Array.from({ length: postIds.length }, () =>
        PostEntityFake()
      );
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockResolvedValue(posts);
      service['filterHiddenPostsWithoutAuth'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const result = await service.searchForPosts({
        queryString: 'test',
        paginationInput: {
          take: 2,
          before: 'before',
        },
        context: newAppContext(),
      });
      expect(result).toEqual(posts.slice(2, 5));
      expect(
        service['openSearchQueryService'].searchPostsAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 4,
          before: 'before',
        },
      });
    });

    it('should add repost parent posts to the app context', async () => {
      const parentPost = PostEntityFake();
      const repost = PostEntityFake();
      repost.repostMeta = {
        parentPostId: parentPost.id,
      };
      repost.baseType = PostBaseType.REPOST;
      const posts = [parentPost, repost];
      service['postService'].findByIds = jest
        .fn()
        .mockImplementation(async (ids: string[]) => {
          return posts.filter(post => {
            return ids.includes(post.id);
          });
        });
      service['postService'].findAllNonExpired = jest
        .fn()
        .mockImplementation(async (ids: string[]) => {
          return posts.filter(post => {
            return ids.includes(post.id);
          });
        });
      service['openSearchQueryService'].searchPostsAndReturnIds = jest
        .fn()
        .mockResolvedValue([repost.id]);
      service['filterHiddenPostsWithoutAuth'] = jest
        .fn()
        .mockImplementation(posts => posts);
      const context = newAppContext();
      await service.searchForPosts({
        queryString: 'test',
        paginationInput: {},
        context,
      });
      expect(context.repostParentPosts[repost.id]).toEqual(parentPost);
    });
  });

  describe('filterHiddenPostsWithoutAuth', () => {
    it('should not show private posts', () => {
      const posts = [
        PostEntityFake({
          isPrivate: false,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
        PostEntityFake({
          isPrivate: true,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
      ];

      const result = service['filterHiddenPostsWithoutAuth'](posts);

      expect(result[0]).toEqual(posts[0]);
      expect(result).toHaveLength(1);
    });

    it('should not show inner circle posts', () => {
      const posts = [
        PostEntityFake({
          isPrivate: false,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.INNER_CIRCLE,
            },
          } as PostAccessControl,
        }),
      ];

      const result = service['filterHiddenPostsWithoutAuth'](posts);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterHiddenPostsForCurrentUser', () => {
    it('should not show private posts to non-followers', async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: false,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
        PostEntityFake({
          isPrivate: true,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(1);
      expect(service['feedService'].find).toBeCalledTimes(3);
    });

    it('should not show inner circle posts to any user', async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: false,
          authorId: currentUserId,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.INNER_CIRCLE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(0);
    });

    it('should show private posts to authors', async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: true,
          authorId: currentUserId,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.INNER_CIRCLE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(0);
    });

    it(`should show private posts to the post author's followers`, async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: true,
          authorId: followedUserId,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(1);
    });

    it('should now show posts created by users that the current user has blocked', async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: false,
          authorId: blockedUserId,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(0);
    });

    it('should now show posts created by users that the current user has been blocked by', async () => {
      const followedUserId = '1';
      const blockedUserId = '2';
      const blockedByUserId = '3';
      const currentUserId = '4';
      const posts = [
        PostEntityFake({
          isPrivate: false,
          authorId: blockedByUserId,
          accessControl: {
            postVisibilityAccessData: {
              access: PostVisibilityAccess.EVERYONE,
            },
          } as PostAccessControl,
        }),
      ];
      const followingFeed = FeedEntityFake({
        page: {
          ids: [followedUserId],
        } as FeedPage,
      });
      const blockedFeed = FeedEntityFake({
        page: {
          ids: [blockedUserId],
        } as FeedPage,
      });
      const blockedByFeed = FeedEntityFake({
        page: {
          ids: [blockedByUserId],
        } as FeedPage,
      });
      const currentUser = UserEntityFake({ id: currentUserId });

      service['feedService'].find = jest.fn().mockImplementation(feedId => {
        if (feedId.startsWith(FeedEntityType.FOLLOWING)) {
          return followingFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCK_LIST)) {
          return blockedFeed;
        } else if (feedId.startsWith(FeedEntityType.BLOCKED_BY_USERS_LIST)) {
          return blockedByFeed;
        }
      });

      const result = await service['filterHiddenPostsForCurrentUser'](
        posts,
        currentUser
      );

      expect(result).toHaveLength(0);
    });
  });
});
