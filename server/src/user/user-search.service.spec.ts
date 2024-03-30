import { FeedEntityType, FeedPage } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserSearchService } from '@verdzie/server/user/user-search.service';
import _ from 'lodash';

describe('UserSearchService', () => {
  let service: UserSearchService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [UserSearchService],
    });
    service = module.get(UserSearchService);
  });

  describe('searchForUsers', () => {
    it('should return users matching the query', async () => {
      const userIds = ['1', '2', '3', '4'];
      service['openSearchQueryService'].searchUsersAndReturnIds = jest
        .fn()
        .mockResolvedValue(userIds);
      service['feedService'].find = jest.fn().mockResolvedValue(
        FeedEntityFake({
          page: {
            ids: ['5'],
          } as FeedPage,
        })
      );
      const users = [
        UserEntityFake({ id: '1' }),
        UserEntityFake({ id: '2' }),
        UserEntityFake({ id: '3' }),
        UserEntityFake({ id: '4' }),
      ];
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);

      const result = await service.searchForUsers({
        queryString: 'test',
        paginationInput: {
          take: 10,
          after: 'test',
        },
      });

      expect(result).toEqual(users);
      expect(
        service['openSearchQueryService'].searchUsersAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 15,
          after: 'test',
        },
      });
      expect(service['feedService'].find).not.toHaveBeenCalled();
      expect(service['userService'].findAllById).toBeCalledWith(userIds);
    });

    it('should filter out users that have blocked the current user', async () => {
      const userIds = ['1', '2', '3', '4'];
      service['openSearchQueryService'].searchUsersAndReturnIds = jest
        .fn()
        .mockResolvedValue(userIds);
      service['feedService'].find = jest.fn().mockResolvedValue(
        FeedEntityFake({
          page: {
            ids: ['2', '4'],
          } as FeedPage,
        })
      );
      const users = [
        UserEntityFake({ id: '1' }),
        UserEntityFake({ id: '3' }),
        undefined,
      ];
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);

      const result = await service.searchForUsers({
        queryString: 'test',
        paginationInput: {
          take: 10,
          after: 'test',
        },
        currentUser: UserEntityFake({ id: '5' }),
      });

      expect(result).toEqual(_.take(users, 2));
      expect(
        service['openSearchQueryService'].searchUsersAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 15,
          after: 'test',
        },
      });
      expect(service['feedService'].find).toBeCalledWith(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, '5')
      );
      expect(service['userService'].findAllById).toBeCalledWith(['1', '3']);
    });

    it('should return take amount', async () => {
      const userIds = ['1', '2', '3'];
      service['openSearchQueryService'].searchUsersAndReturnIds = jest
        .fn()
        .mockResolvedValue(userIds);
      service['feedService'].find = jest.fn().mockResolvedValue(
        FeedEntityFake({
          page: {
            ids: ['5'],
          } as FeedPage,
        })
      );
      const users = [
        UserEntityFake({ id: '1' }),
        UserEntityFake({ id: '2' }),
        UserEntityFake({ id: '3' }),
        undefined,
      ];
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);

      const result = await service.searchForUsers({
        queryString: 'test',
        paginationInput: {
          take: 2,
          after: 'test',
        },
        currentUser: UserEntityFake({ id: '6' }),
      });

      expect(result).toEqual(users.slice(0, 2));
      expect(
        service['openSearchQueryService'].searchUsersAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 3,
          after: 'test',
        },
      });
      expect(service['feedService'].find).toBeCalledWith(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, '6')
      );
      expect(service['userService'].findAllById).toBeCalledWith([
        '1',
        '2',
        '3',
      ]);
    });

    it('should take from end during reverse pagination', async () => {
      const userIds = ['1', '2', '3'];
      service['openSearchQueryService'].searchUsersAndReturnIds = jest
        .fn()
        .mockResolvedValue(userIds);
      service['feedService'].find = jest.fn().mockResolvedValue(
        FeedEntityFake({
          page: {
            ids: ['5'],
          } as FeedPage,
        })
      );
      const users = [
        UserEntityFake({ id: '1' }),
        UserEntityFake({ id: '2' }),
        UserEntityFake({ id: '3' }),
        undefined,
      ];
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);

      const result = await service.searchForUsers({
        queryString: 'test',
        paginationInput: {
          take: 2,
          before: 'test',
        },
        currentUser: UserEntityFake({ id: '6' }),
      });

      expect(result).toEqual(users.slice(1, 3));
      expect(
        service['openSearchQueryService'].searchUsersAndReturnIds
      ).toBeCalledWith({
        queryString: 'test',
        paginationInput: {
          take: 3,
          before: 'test',
        },
      });
      expect(service['feedService'].find).toBeCalledWith(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, '6')
      );
      expect(service['userService'].findAllById).toBeCalledWith([
        '1',
        '2',
        '3',
      ]);
    });
  });
});
