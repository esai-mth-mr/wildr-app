import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { MobileFeatureFlags } from '@verdzie/server/ssm-params/dto/mobile-featureflags';
import { OpenSearchParamsDto } from '@verdzie/server/ssm-params/dto/open-search-params.dto';
import {
  BadSSMParamException,
  SSMParamNotFoundException,
} from '@verdzie/server/ssm-params/ssm-params.errors';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';

describe('SSMParamsService', () => {
  const service = SSMParamsService.Instance;

  describe('getPath', () => {
    it('should return the path', () => {
      expect(service['getPath']('test')).toEqual('/wildr-prod-1/test');
    });
  });

  describe('getParam', () => {
    it('should return the params', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({
            test: 'test',
          }),
        },
      });
      const result = await service['getParam']({ segment: 'test' });
      expect(result._unsafeUnwrap()).toEqual(
        JSON.stringify({
          test: 'test',
        })
      );
      const sendCall = service['client'].send as jest.Mock;
      expect(sendCall.mock.calls.length).toEqual(1);
      expect(JSON.stringify(sendCall.mock.calls[0][0])).toEqual(
        JSON.stringify(
          new GetParameterCommand({
            Name: '/wildr-prod-1/test',
            WithDecryption: false,
          })
        )
      );
    });

    it('should use decryption if specified', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({
            test: 'test',
          }),
        },
      });
      const result = await service['getParam']({
        segment: 'test',
        withDecryption: true,
      });
      expect(result._unsafeUnwrap()).toEqual(
        JSON.stringify({
          test: 'test',
        })
      );
      const sendCall = service['client'].send as jest.Mock;
      expect(sendCall.mock.calls.length).toEqual(1);
      expect(JSON.stringify(sendCall.mock.calls[0][0])).toEqual(
        JSON.stringify(
          new GetParameterCommand({
            Name: '/wildr-prod-1/test',
            WithDecryption: true,
          })
        )
      );
    });

    it('should return an error if the param does not exist', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: undefined,
      });
      const result = await service['getParam']({ segment: 'test' });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SSMParamNotFoundException
      );
    });

    it('should return an error if the request fails', async () => {
      service['client'].send = jest
        .fn()
        .mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await service['getParam']({ segment: 'test' });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });

  describe('validateParam', () => {
    it('should return the param if it is valid', async () => {
      const result = await service['validateParam']({
        param: JSON.stringify({
          OPEN_SEARCH_URL: 'test_url',
          OPEN_SEARCH_USER: 'test_username',
          OPEN_SEARCH_PASSWORD: Buffer.from('test_password').toString('base64'),
          OPEN_SEARCH_USER_QUERY_INDEX: 'test_user_query_index',
          OPEN_SEARCH_EMPTY_USER_QUERY_INDEX: 'test_empty_user_query_index',
          OPEN_SEARCH_POST_QUERY_INDEX: 'test_post_query_index',
          OPEN_SEARCH_EMPTY_POST_QUERY_INDEX: 'test_empty_post_query_index',
          OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS: ['test_category_id'],
          OPEN_SEARCH_QUERY_SIZE: 10,
          OPEN_SEARCH_RE_INDEX_DELAY: 1000,
          OPEN_SEARCH_USER_SEARCH_V2_ENABLED: true,
          OPEN_SEARCH_POST_SEARCH_V2_ENABLED: true,
        }),
        dto: OpenSearchParamsDto,
      });
      expect(result._unsafeUnwrap()).toEqual({
        OPEN_SEARCH_URL: 'test_url',
        OPEN_SEARCH_USER: 'test_username',
        OPEN_SEARCH_PASSWORD: 'test_password',
        OPEN_SEARCH_USER_QUERY_INDEX: 'test_user_query_index',
        OPEN_SEARCH_EMPTY_USER_QUERY_INDEX: 'test_empty_user_query_index',
        OPEN_SEARCH_POST_QUERY_INDEX: 'test_post_query_index',
        OPEN_SEARCH_EMPTY_POST_QUERY_INDEX: 'test_empty_post_query_index',
        OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS: ['test_category_id'],
        OPEN_SEARCH_QUERY_SIZE: 10,
        OPEN_SEARCH_RE_INDEX_DELAY: 1000,
        OPEN_SEARCH_USER_SEARCH_V2_ENABLED: true,
        OPEN_SEARCH_POST_SEARCH_V2_ENABLED: true,
      });
    });

    it('should return an error if the param is invalid', async () => {
      const result = await service['validateParam']({
        param: JSON.stringify({
          test: 'test',
        }),
        dto: OpenSearchParamsDto,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(BadSSMParamException);
    });

    it('should return an error if the param fails json parse', async () => {
      const result = await service['validateParam']({
        param: 'test',
        dto: OpenSearchParamsDto,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(BadSSMParamException);
    });
  });

  describe('updateACLParams', () => {
    it('should update the params', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({}),
        },
      });
      await service['updateACLParams']();
      expect(service.aclParams).toEqual({});
      const sendCall = service['client'].send as jest.Mock;
      expect(sendCall.mock.calls.length).toEqual(1);
      expect(JSON.stringify(sendCall.mock.calls[0][0])).toEqual(
        JSON.stringify(
          new GetParameterCommand({
            Name: '/wildr-prod-1/acl',
            WithDecryption: false,
          })
        )
      );
    });

    it('should set the defaults if an error occurs', async () => {
      service['client'].send = jest.fn().mockRejectedValue(new Error());
      await service['updateACLParams']();
      expect(service.aclParams).toEqual({});
    });

    it('should set defaults if param is invalid', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({
            test: 'test',
          }),
        },
      });
      await service['updateACLParams']();
      expect(service.aclParams).toEqual({});
    });
  });

  describe('updateMobileVersionToFeatureFlagsMap', () => {
    it('should update the params', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({
            '2023.10.1': {
              CREATE_POST_V1: false,
              CREATE_POST_V2: true,
              BANNERS_ENABLED: false,
              COIN_DB_PT_1: true,
              COIN_DB_PT_2: true,
              VIDEO_COMPRESSION_960_QUALITY: true,
            },
            '1.7.3': { CREATE_POST_V1: true, CREATE_POST_V2: false },
            '1.7.2': { CREATE_POST_V1: true, CREATE_POST_V2: false },
            '1.6.1': { CREATE_POST_V1: true, CREATE_POST_V2: false },
          }),
        },
      });
      await service['updateMobileFeatureFlags']();
      const resultMap = new Map<string, MobileFeatureFlags>();
      resultMap.set(
        '2023.10.1',
        new MobileFeatureFlags({
          CREATE_POST_V1: false,
          CREATE_POST_V2: true,
          BANNERS_ENABLED: false,
          COIN_DB_PT_1: true,
          COIN_DB_PT_2: true,
          VIDEO_COMPRESSION_960_QUALITY: true,
        })
      );
      resultMap.set(
        '1.7.3',
        new MobileFeatureFlags({
          CREATE_POST_V1: true,
          CREATE_POST_V2: false,
          BANNERS_ENABLED: false,
          COIN_DB_PT_1: false,
          COIN_DB_PT_2: false,
          VIDEO_COMPRESSION_960_QUALITY: false,
        })
      );
      resultMap.set(
        '1.7.2',
        new MobileFeatureFlags({
          CREATE_POST_V1: true,
          CREATE_POST_V2: false,
          BANNERS_ENABLED: false,
          COIN_DB_PT_1: false,
          COIN_DB_PT_2: false,
          VIDEO_COMPRESSION_960_QUALITY: false,
        })
      );
      resultMap.set(
        '1.6.1',
        new MobileFeatureFlags({
          CREATE_POST_V1: true,
          CREATE_POST_V2: false,
          BANNERS_ENABLED: false,
          COIN_DB_PT_1: false,
          COIN_DB_PT_2: false,
          VIDEO_COMPRESSION_960_QUALITY: false,
        })
      );
      expect(service.mobileVersionToFeatureFlagsMap).toEqual(resultMap);
      const sendCall = service['client'].send as jest.Mock;
      expect(sendCall.mock.calls.length).toEqual(1);
      expect(JSON.stringify(sendCall.mock.calls[0][0])).toEqual(
        JSON.stringify(
          new GetParameterCommand({
            Name: '/wildr-prod-1/mobile-feature-flags',
            WithDecryption: false,
          })
        )
      );
    });

    it('check validity of the sortMobileVersionToFeatureFlagsMapDesc()', () => {
      const mobileVersionToFeatureFlagsMap = new Map<
        string,
        MobileFeatureFlags
      >();
      mobileVersionToFeatureFlagsMap.set(
        '2023.10.1',
        new MobileFeatureFlags({ CREATE_POST_V1: false, CREATE_POST_V2: true })
      );
      mobileVersionToFeatureFlagsMap.set(
        '1.6.1',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      mobileVersionToFeatureFlagsMap.set(
        '1.7.2',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      mobileVersionToFeatureFlagsMap.set(
        '1.7.3',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      service['mobileVersionToFeatureFlagsMap'] =
        mobileVersionToFeatureFlagsMap;
      service['sortMobileVersionToFeatureFlagsMapDesc']();
      const resultMap = new Map<string, MobileFeatureFlags>();
      resultMap.set(
        '2023.10.1',
        new MobileFeatureFlags({ CREATE_POST_V1: false, CREATE_POST_V2: true })
      );
      resultMap.set(
        '1.7.3',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      resultMap.set(
        '1.7.2',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      resultMap.set(
        '1.6.1',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      expect([
        ...service['mobileVersionToFeatureFlagsMap'].keys(),
      ]).toStrictEqual([...resultMap.keys()]);
    });

    it('the map should be sorted in descending order', async () => {
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify({
            '1.7.2': { CREATE_POST_V1: true, CREATE_POST_V2: false },
            '2023.10.1': { CREATE_POST_V1: false, CREATE_POST_V2: true },
            '1.7.3': { CREATE_POST_V1: true, CREATE_POST_V2: false },
            '1.6.1': { CREATE_POST_V1: true, CREATE_POST_V2: false },
          }),
        },
      });
      await service['updateMobileFeatureFlags']();
      const resultMap = new Map<string, MobileFeatureFlags>();
      resultMap.set(
        '2023.10.1',
        new MobileFeatureFlags({ CREATE_POST_V1: false, CREATE_POST_V2: true })
      );
      resultMap.set(
        '1.7.3',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      resultMap.set(
        '1.7.2',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      resultMap.set(
        '1.6.1',
        new MobileFeatureFlags({ CREATE_POST_V1: true, CREATE_POST_V2: false })
      );
      expect([
        ...service['mobileVersionToFeatureFlagsMap'].keys(),
      ]).toStrictEqual([...resultMap.keys()]);
      const sendCall = service['client'].send as jest.Mock;
      expect(sendCall.mock.calls.length).toEqual(1);
      expect(JSON.stringify(sendCall.mock.calls[0][0])).toEqual(
        JSON.stringify(
          new GetParameterCommand({
            Name: '/wildr-prod-1/mobile-feature-flags',
            WithDecryption: false,
          })
        )
      );
    });
  });

  describe('updateOpenSearchParams', () => {
    it('should retrieve and update the params', async () => {
      const params = {
        OPEN_SEARCH_URL: 'test_url',
        OPEN_SEARCH_USER: 'test_username',
        OPEN_SEARCH_PASSWORD: Buffer.from('test_password').toString('base64'),
        OPEN_SEARCH_USER_QUERY_INDEX: 'test_user_query_index',
        OPEN_SEARCH_EMPTY_USER_QUERY_INDEX: 'test_empty_user_query_index',
        OPEN_SEARCH_POST_QUERY_INDEX: 'test_post_query_index',
        OPEN_SEARCH_EMPTY_POST_QUERY_INDEX: 'test_empty_post_query_index',
        OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS: ['test_category_id'],
        OPEN_SEARCH_QUERY_SIZE: 10,
        OPEN_SEARCH_RE_INDEX_DELAY: 1000,
        OPEN_SEARCH_USER_SEARCH_V2_ENABLED: true,
        OPEN_SEARCH_POST_SEARCH_V2_ENABLED: true,
      };
      // @ts-ignore
      service['env'] = 'param-test';
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify(params),
        },
      });
      await service['updateOpenSearchParams']();
      expect(service.openSearchParams).toEqual({
        ...params,
        OPEN_SEARCH_PASSWORD: 'test_password',
      });
    });
  });

  describe(SSMParamsService.prototype['updateBannerParams'].name, () => {
    it('should retrieve and update the params', async () => {
      const params = {
        WILDR_COIN_WAITLIST_BANNER_IDS: ['test-banner-id'],
      };
      // @ts-ignore
      service['env'] = 'param-test';
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify(params),
        },
      });
      await service['updateBannerParams']();
      expect(service.bannerParams).toEqual(params);
    });
  });

  describe(SSMParamsService.prototype['updateWebAppFeatureFlags'].name, () => {
    it('should retrieve and update the params', async () => {
      const params = {
        WILDR_COIN_WAITLIST_ENABLED: true,
      };
      // @ts-ignore
      service['env'] = 'param-test';
      service['client'].send = jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify(params),
        },
      });
      await service['updateWebAppFeatureFlags']();
      expect(service.webAppFeatureFlags).toEqual(params);
    });
  });
});
