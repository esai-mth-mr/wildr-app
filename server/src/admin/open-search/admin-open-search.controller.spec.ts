import { AdminOpenSearchController } from '@verdzie/server/admin/open-search/admin-open-search.controller';
import { USER_SEARCH_V1_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('AdminOpenSearchController', () => {
  describe('constructIndex', () => {
    it('should call openSearchService.startIndexConstruction', async () => {
      const module = await createMockedTestingModule({
        providers: [AdminOpenSearchController],
      });
      const controller = module.get<AdminOpenSearchController>(
        AdminOpenSearchController
      );
      // @ts-ignore
      controller['openSearchService'] = {
        startIndexConstruction: jest.fn(),
      };

      await controller.constructIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-version-alias',
      });

      expect(
        controller['openSearchService'].startIndexConstruction
      ).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-version-alias',
      });
    });
  });
});
