import { newAppContext } from '@verdzie/server/common';
import { ESInput, ESearchType } from '@verdzie/server/generated-graphql';
import { OpenSearchResolver } from '@verdzie/server/open-search/openSearch.resolver';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe('OpenSearchResolver', () => {
  let resolver: OpenSearchResolver;

  beforeEach(async () => {
    resolver = (
      await createMockedTestingModule({
        providers: [OpenSearchResolver],
      })
    ).get(OpenSearchResolver);
  });

  describe('elasticSearch', () => {
    it('should search for users with query string', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      resolver['userSearchService'].searchForUsers = jest
        .fn()
        .mockResolvedValue(users);
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set([user.id]);
      await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['userSearchService'].searchForUsers).toHaveBeenCalledWith(
        {
          queryString: input.query,
          paginationInput: {
            take: 2,
          },
          currentUser: user,
        }
      );
    });

    it('should return found users', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      resolver['userService'].toUserObject = jest
        .fn()
        .mockImplementation(async u => u.user);
      resolver['userSearchService'].searchForUsers = jest
        .fn()
        .mockResolvedValue(users);
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set([user.id]);
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(result.__typename).toBe('ESResult');
      if (result.__typename === 'ESResult') {
        expect(result.result).toEqual(users);
      }
    });

    it('should filter out missing users', async () => {
      const users = [UserEntityFake(), undefined, UserEntityFake()];
      resolver['userService'].toUserObject = jest
        .fn()
        .mockImplementation(async u => u.user);
      resolver['userSearchService'].searchForUsers = jest
        .fn()
        .mockResolvedValue(users);
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set([user.id]);
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(result.__typename).toBe('ESResult');
      if (result.__typename === 'ESResult') {
        expect(result.result).toEqual([users[0], users[2]]);
      }
    });

    it('should search for users when user search v2 is enabled', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      resolver['userSearchService'].searchForUsers = jest
        .fn()
        .mockResolvedValue(users);
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['userSearchV2Enabled'] = true;
      await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['userSearchService'].searchForUsers).toHaveBeenCalledWith(
        {
          queryString: input.query,
          paginationInput: {
            take: 2,
          },
          currentUser: user,
        }
      );
    });

    it('should return a smart error when no users are found', async () => {
      resolver['userSearchService'].searchForUsers = jest
        .fn()
        .mockResolvedValue([]);
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['userSearchV2Enabled'] = true;
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(result.__typename).toBe('SmartError');
      if (result.__typename === 'SmartError') {
        expect(result.message).toBe('No users found');
      }
    });

    it('should search for posts when user is whitelisted', async () => {
      const posts = [PostEntityFake(), PostEntityFake()];
      resolver['postSearchService'].searchForPosts = jest
        .fn()
        .mockResolvedValue(posts);
      const input: ESInput = {
        type: ESearchType.POST,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set([user.id]);
      await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['postSearchService'].searchForPosts).toHaveBeenCalledWith(
        {
          queryString: input.query,
          paginationInput: {
            take: 2,
          },
          context: expect.anything(),
          currentUser: user,
        }
      );
    });

    it('should search for posts when the post search v2 is enabled', async () => {
      const posts = [PostEntityFake(), PostEntityFake()];
      resolver['postSearchService'].searchForPosts = jest
        .fn()
        .mockResolvedValue(posts);
      const input: ESInput = {
        type: ESearchType.POST,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['postSearchV2Enabled'] = true;
      await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['postSearchService'].searchForPosts).toHaveBeenCalledWith(
        {
          queryString: input.query,
          paginationInput: {
            take: 2,
          },
          context: expect.anything(),
          currentUser: user,
        }
      );
    });

    it('should return a smart error when no posts are found', async () => {
      resolver['postSearchService'].searchForPosts = jest
        .fn()
        .mockResolvedValue([]);
      const input: ESInput = {
        type: ESearchType.POST,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['postSearchV2Enabled'] = true;
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(result.__typename).toBe('SmartError');
      if (result.__typename === 'SmartError') {
        expect(result.message).toBe('No posts found');
      }
    });

    it('should use old post search when user is not whitelisted and v2 not enabled', async () => {
      const posts = [PostEntityFake(), PostEntityFake()];
      resolver['service'].search = jest.fn().mockResolvedValue(posts);
      // @ts-ignore-private
      resolver['postSearchV2Enabled'] = false;
      const input: ESInput = {
        type: ESearchType.POST,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set();
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['service'].search).toHaveBeenCalledWith(
        input,
        expect.anything(),
        user
      );
      expect(result.__typename).toBe('ESResult');
      if (result.__typename === 'ESResult') {
        expect(result.result).toEqual(posts);
      }
    });

    it('should use old user search when user is not whitelisted and v2 no enabled', async () => {
      const users = [UserEntityFake(), UserEntityFake()];
      resolver['service'].search = jest.fn().mockResolvedValue(users);
      // @ts-ignore-private
      resolver['userSearchV2Enabled'] = false;
      const input: ESInput = {
        type: ESearchType.USER,
        paginationInput: {
          take: 2,
        },
        query: 'test',
      };
      const user = UserEntityFake();
      // @ts-ignore-private
      resolver['whiteListedIds'] = new Set();
      const result = await resolver.elasticSearch(input, newAppContext(), user);
      expect(resolver['service'].search).toHaveBeenCalledWith(
        input,
        expect.anything(),
        user
      );
      expect(result.__typename).toBe('ESResult');
      if (result.__typename === 'ESResult') {
        expect(result.result).toEqual(users);
      }
    });
  });
});
