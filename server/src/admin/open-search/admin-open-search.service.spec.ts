import { AdminOpenSearchService } from '@verdzie/server/admin/open-search/admin-open-search.service';
import { USER_SEARCH_V1_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('AdminOpenSearchService', () => {
  describe('startIndexConstruction', () => {
    it('should call indexingService.upsertMapping', async () => {
      const module = await createMockedTestingModule({
        providers: [AdminOpenSearchService],
      });
      const service = module.get<AdminOpenSearchService>(
        AdminOpenSearchService
      );
      // @ts-ignore
      service['indexingService'] = {
        upsertMapping: jest.fn(),
      };

      await service.startIndexConstruction({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index_version_alias',
      });

      expect(service['indexingService'].upsertMapping).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index_version_alias',
      });
    });

    it('should call osReIndexCoordinatorProducer.reIndex', async () => {
      const module = await createMockedTestingModule({
        providers: [AdminOpenSearchService],
      });
      const service = module.get<AdminOpenSearchService>(
        AdminOpenSearchService
      );
      // @ts-ignore
      service['osReIndexCoordinatorProducer'] = {
        reIndex: jest.fn(),
      };

      await service.startIndexConstruction({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index_version_alias',
      });

      expect(
        service['osReIndexCoordinatorProducer'].reIndex
      ).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index_version_alias',
      });
    });
  });
});
