import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('EntitiesWithPagesCommon', () => {
  let service: EntitiesWithPagesCommon;

  beforeEach(async () => {
    service = (
      await createMockedTestingModule({
        providers: [EntitiesWithPagesCommon],
      })
    ).get<EntitiesWithPagesCommon>(EntitiesWithPagesCommon);
  });

  describe('getIdsFromPage', () => {
    it('should return a page of ids after a given cursor', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        after: '5',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['4', '3']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should return a page of ids after on reverse chron feed', () => {
      const page = ['5', '4', '3', '2', '1'];
      const paginationInput: PaginationInput = {
        take: 2,
        after: '2',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        undefined,
        true
      );
      expect(result.ids).toEqual(['4', '3']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should return a page of ids before a given cursor', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        before: '2',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['4', '3']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should return a page of ids before on reverse chron feed', () => {
      const page = ['5', '4', '3', '2', '1'];
      const paginationInput: PaginationInput = {
        take: 2,
        before: '5',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        undefined,
        true
      );
      expect(result.ids).toEqual(['4', '3']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should return a page includingAndAfter a given cursor', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        includingAndAfter: '5',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['5', '4']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(false);
    });

    it('should return a page includingAndBefore a given cursor', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        includingAndBefore: '1',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['2', '1']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(false);
    });

    it('should return a page includingAndBefore a given cursor on reverse chron feed', () => {
      const page = ['5', '4', '3', '2', '1'];
      const paginationInput: PaginationInput = {
        take: 2,
        includingAndBefore: '1',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        undefined,
        true
      );
      expect(result.ids).toEqual(['1']);
      expect(result.hasMoreItems).toEqual(false);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should indicate that there are no more items when the end of the page is reached', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        after: '2',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['1']);
      expect(result.hasMoreItems).toEqual(false);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should indicate that there are no previous items when the start of the page is reached', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        includingAndBefore: '1',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(page, paginationInput);
      expect(result.ids).toEqual(['2', '1']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(false);
    });

    it('should filter ids using the predicate', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        after: '5',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        id => id !== '4'
      );
      expect(result.ids).toEqual(['3', '2']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should use the filtered ids when checking if more items remain', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        after: '4',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        id => id !== '1'
      );
      expect(result.ids).toEqual(['3', '2']);
      expect(result.hasMoreItems).toEqual(false);
      expect(result.hasPreviousItems).toEqual(true);
    });

    it('should use the filtered ids when checking if there are previous items', () => {
      const page = ['1', '2', '3', '4', '5'];
      const paginationInput: PaginationInput = {
        take: 2,
        includingAndBefore: '2',
        pageNumber: 1,
      };
      const result = service.getIdsFromPage(
        page,
        paginationInput,
        id => id !== '1'
      );
      expect(result.ids).toEqual(['3', '2']);
      expect(result.hasMoreItems).toEqual(true);
      expect(result.hasPreviousItems).toEqual(false);
    });
  });
});
