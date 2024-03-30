import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  EntityIndexUpdateLogItem,
  OSIndexWALService,
} from './index-wal.service';
import {
  USER_SEARCH_V1_INDEX_NAME,
  UserSnapshot,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { UserEntityIndexLog } from '@verdzie/server/open-search-v2/index-wal/user-entity/user-entity-index-log.entity.bi';
import Sinon from 'sinon';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';

describe('IndexWALService', () => {
  let service: OSIndexWALService;
  let clock: Sinon.SinonFakeTimers;

  beforeAll(() => {
    clock = Sinon.useFakeTimers();
  });

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [OSIndexWALService],
    });
    service = module.get<OSIndexWALService>(OSIndexWALService);
  });

  afterAll(() => {
    clock.restore();
  });

  describe('logEntityIndexUpdates', () => {
    it('should log serialized entities', async () => {
      const indexVersion = USER_SEARCH_V1_INDEX_NAME;
      const indexAlias = 'user_search_test';
      const updates: EntityIndexUpdateLogItem[] = [
        {
          indexVersion,
          indexAlias,
          entitySnapshot: {
            __typename: 'UserSnapshot',
            id: '1',
            name: 'John Doe',
          } as UserSnapshot,
        },
        {
          indexVersion,
          indexAlias,
          entitySnapshot: {
            __typename: 'UserSnapshot',
            id: '2',
            name: 'Jane Doe',
          } as UserSnapshot,
        },
      ];
      const repo = {
        insert: jest.fn(),
      };
      service['connection'].getRepository = jest.fn().mockReturnValue(repo);
      await service.logEntityIndexUpdates(updates);
      expect(service['connection'].getRepository).toBeCalledWith(
        UserEntityIndexLog
      );
      const inserted = repo.insert.mock.calls[0][0];
      expect(inserted.length).toBe(2);
      expect(inserted[0]).toBeInstanceOf(UserEntityIndexLog);
      expect(inserted[1]).toBeInstanceOf(UserEntityIndexLog);
    });

    it('should add index in batch to log ids to prevent key conflicts', async () => {
      const indexVersion = USER_SEARCH_V1_INDEX_NAME;
      const indexAlias = 'user_search_test';
      const updates: EntityIndexUpdateLogItem[] = [
        {
          indexVersion,
          indexAlias,
          entitySnapshot: {
            __typename: 'UserSnapshot',
            id: '1',
            name: 'John Doe',
          } as UserSnapshot,
        },
        {
          indexVersion,
          indexAlias,
          entitySnapshot: {
            __typename: 'UserSnapshot',
            id: '2',
            name: 'Jane Doe',
          } as UserSnapshot,
        },
      ];
      const repo = {
        insert: jest.fn(),
      };
      service['connection'].getRepository = jest.fn().mockReturnValue(repo);
      await service.logEntityIndexUpdates(updates);
      expect(service['connection'].getRepository).toBeCalledWith(
        UserEntityIndexLog
      );
      const inserted = repo.insert.mock.calls[0][0];
      expect(inserted[0].id).toBe(
        `${updates[0].entitySnapshot.id}${ID_SEPARATOR}${clock.now}${ID_SEPARATOR}0`
      );
      expect(inserted[1].id).toBe(
        `${updates[1].entitySnapshot.id}${ID_SEPARATOR}${clock.now}${ID_SEPARATOR}1`
      );
    });

    it('should return if there are no updates to log', async () => {
      const updates = [] as any;
      const repo = {
        insert: jest.fn(),
      };
      service['connection'].getRepository = jest.fn().mockReturnValue(repo);
      await service.logEntityIndexUpdates(updates);
      expect(service['connection'].getRepository).not.toBeCalled();
    });
  });
});
