import { insertToSortedArray } from '@verdzie/server/common/insert-to-sorted-array';

describe('insertToSortedArray', () => {
  it('should insert items in order', () => {
    const array: number[] = [];
    for (let i = 0; i < 200; i++) {
      insertToSortedArray({
        array,
        element: Math.floor(Math.random() * 100),
        getValue: el => el,
      });
      const arrayCopy = [...array];
      arrayCopy.sort((a, b) => a - b);
      expect(arrayCopy).toEqual(array);
    }
  });
});
