import {
  keyValuePairArrayToObject,
  retryWithBackoff,
} from '@verdzie/server/common';

describe('common', () => {
  describe('retryWithBackoff', () => {
    it('should run the function and return its result', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const result = await retryWithBackoff({
        fn,
        retryCount: 3,
        throwAfterFailedRetries: false,
      });
      expect(result).toEqual('result');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry the function the specified number of times', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockRejectedValueOnce(new Error('error'));
      const result = await retryWithBackoff({
        fn,
        retryCount: 1,
        throwAfterFailedRetries: false,
      });
      expect(result).toEqual(undefined);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw if specified to do so', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockRejectedValueOnce(new Error('error'));
      await expect(
        retryWithBackoff({
          fn,
          retryCount: 1,
          throwAfterFailedRetries: true,
        })
      ).rejects.toThrow('error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should return the result after retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValueOnce('result');
      const result = await retryWithBackoff({
        fn,
        retryCount: 1,
        throwAfterFailedRetries: false,
      });
      expect(result).toEqual('result');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('keyValuePairArrayToObject', () => {
    it('should convert an array of key value pairs to an object', () => {
      const result = keyValuePairArrayToObject([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ]);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });
});
