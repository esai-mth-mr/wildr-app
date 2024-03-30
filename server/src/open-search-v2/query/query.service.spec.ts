import {
  DEFAULT_PAGE_SIZE,
  OSQueryService,
} from '@verdzie/server/open-search-v2/query/query.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from '@verdzie/server/user/user.entity';

const QUERY_SIZE = 1000;

describe('OSQueryService', () => {
  describe('searchAndReturnIds', () => {
    let service: OSQueryService;

    beforeEach(async () => {
      const module = await createMockedTestingModule({
        providers: [OSQueryService],
      });
      service = module.get(OSQueryService);
    });

    it('should return 6 ids by default', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {},
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '/test_production/_search',
        {
          from: 0,
          size: QUERY_SIZE,
          query: {},
        }
      );
    });

    it('should skip ids before the after id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          after: '4',
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('5');
    });

    it('should skip ids before and but include the includingAndAfter id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndAfter: '4',
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('4');
    });

    it('should return the number of ids specified by take', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
    });

    it('should return the number of ids specified by take and skip ids before the after id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          after: '4',
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('5');
      expect(result[1]).toBe('6');
      expect(result[2]).toBe('7');
    });

    it('should return the number of ids specified by take and skip ids before but include the includingAndAfter id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndAfter: '4',
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('4');
      expect(result[1]).toBe('5');
      expect(result[2]).toBe('6');
    });

    it('should return ids before the before id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          before: '4',
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
      expect(result[3]).toBe('3');
    });

    it('should return ids before and include the includingAndBefore id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndBefore: '4',
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
      expect(result[3]).toBe('3');
      expect(result[4]).toBe('4');
    });

    it('should return the number of ids specified by take before the before id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          before: '4',
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('1');
      expect(result[1]).toBe('2');
      expect(result[2]).toBe('3');
    });

    it('should return the number of ids specified by take before the before id and include the includingAndBefore id', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndBefore: '4',
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('2');
      expect(result[1]).toBe('3');
      expect(result[2]).toBe('4');
    });

    it('should handle the case where the before id is not found', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          before: '11',
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
    });

    it('should handle the case where the after id is not found', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          after: String(DEFAULT_PAGE_SIZE + 10),
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
    });

    it('should handle the case where the includingAndAfter id is not found', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndAfter: String(DEFAULT_PAGE_SIZE + 10),
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
    });

    it('should handle the case where the includingAndBefore id is not found', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(DEFAULT_PAGE_SIZE + 5)
                .fill(null)
                .map((_, index) => ({
                  _id: index.toString(),
                })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          includingAndBefore: String(DEFAULT_PAGE_SIZE + 10),
        },
      });

      expect(result).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result[0]).toBe('0');
      expect(result[1]).toBe('1');
      expect(result[2]).toBe('2');
    });

    it('should handle take being greater than the number of results', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(3).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          after: '0',
          take: 10,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('1');
      expect(result[1]).toBe('2');
    });

    it('should handle take resulting in negative start index', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;

      const result = await service['searchAndReturnIds']({
        queryString: 'test',
        indexVersion: {
          name: 'test',
          getQuery: () => ({}),
        } as any,
        paginationInput: {
          take: 10,
          before: '1',
        },
      });

      expect(result).toHaveLength(10);
    });
  });

  describe('searchPostsAndReturnIds', () => {
    let service: OSQueryService;

    beforeEach(async () => {
      const module = await createMockedTestingModule({
        providers: [OSQueryService],
      });
      service = module.get(OSQueryService);
    });

    it('should search posts', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;
      const getQuery = jest.fn().mockReturnValue({});
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: 'test',
            getQuery: getQuery,
          } as any,
        ]);

      const result = await service.searchPostsAndReturnIds({
        queryString: 'test',
        paginationInput: {
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('0');
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '/test_production/_search',
        {
          query: {},
          from: 0,
          size: QUERY_SIZE,
        }
      );
      expect(getQuery).toHaveBeenCalledWith('test');
    });
  });

  describe('searchUsersAndReturnIds', () => {
    let service: OSQueryService;

    beforeEach(async () => {
      const module = await createMockedTestingModule({
        providers: [OSQueryService],
      });
      service = module.get(OSQueryService);
    });

    it('should search for users', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;
      const getQuery = jest.fn().mockReturnValue({});
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: 'test',
            getQuery: getQuery,
          } as any,
        ]);

      const result = await service.searchPostsAndReturnIds({
        queryString: 'test',
        paginationInput: {
          take: 3,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('0');
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '/test_production/_search',
        {
          query: {},
          from: 0,
          size: QUERY_SIZE,
        }
      );
      expect(getQuery).toHaveBeenCalledWith('test');
    });

    it('should search for users using empty index if index is specified', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;
      const getQuery = jest.fn().mockReturnValue({});
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: 'empty_test',
            getQuery: getQuery,
          } as any,
        ]);
      // @ts-ignore-private
      service['userEmptyQueryIndexVersionName'] = 'empty_test';
      const result = await service.searchUsersAndReturnIds({
        queryString: '',
        paginationInput: {
          take: 3,
        },
      });
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('0');
      expect(
        service['indexVersionService'].findIndexVersions
      ).toHaveBeenCalledWith(UserEntity, ['empty_test']);
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '/empty_test_production/_search',
        {
          query: {},
          from: 0,
          size: QUERY_SIZE,
        }
      );
      expect(getQuery).toHaveBeenCalledWith('');
    });

    it('should default to base index if no empty query index is specified', async () => {
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            hits: {
              hits: new Array(10).fill(null).map((_, index) => ({
                _id: index.toString(),
              })),
            },
          },
        }),
      } as any;
      const getQuery = jest.fn().mockReturnValue({});
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: 'user_search_v1',
            getQuery: getQuery,
          } as any,
        ]);
      // @ts-ignore-private
      service['userEmptyQueryIndexVersionName'] = undefined;
      const result = await service.searchUsersAndReturnIds({
        queryString: '',
        paginationInput: {
          take: 3,
        },
      });
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('0');
      expect(
        service['indexVersionService'].findIndexVersions
      ).toHaveBeenCalledWith(UserEntity, ['user_search_v1']);
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '/user_search_v1_production/_search',
        {
          query: {},
          from: 0,
          size: QUERY_SIZE,
        }
      );
      expect(getQuery).toHaveBeenCalledWith('');
    });
  });
});
