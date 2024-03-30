import {
  BannerContent,
  BannerData,
  BannerEntity,
  BannerMetadata,
  BannerSettings,
  BannerState,
} from '@verdzie/server/banner/banner.entity';
import { FileProperties } from '@verdzie/server/post/postProperties';
import { nanoid } from 'nanoid';

export function BannerEntityFake(
  overrides: Partial<BannerEntity> = {}
): BannerEntity {
  const bannerEntity = new BannerEntity({
    id: nanoid(16),
    data: BannerDataFake(),
    state: BannerState.ENABLED,
    countryCode: undefined,
    startDate: undefined,
    endDate: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  Object.assign(bannerEntity, overrides);
  return bannerEntity;
}

export function BannerDataFake(
  overrides: Partial<BannerData> = {}
): BannerData {
  const bannerData: BannerData = {
    content: BannerContentFake(),
    settings: BannerSettingsFake(),
    metadata: BannerMetadataFake(),
  };
  Object.assign(bannerData, overrides);
  return bannerData;
}

export function BannerContentFake(
  overrides: Partial<BannerContent> = {}
): BannerContent {
  const bannerContent: BannerContent = {
    title: 'Wanna make some cash?',
    description: 'Signup for the wildr coin waitlist!',
    cta: 'Learn More',
    asset: FilePropertiesFake(),
    route: {
      __typename: 'WalletPageRoute',
      nestedRoute: {
        __typename: 'WalletTransactionNestedRoute',
        transactionId: nanoid(32),
      },
    },
  };
  Object.assign(bannerContent, overrides);
  return bannerContent;
}

export function FilePropertiesFake(
  overrides: Partial<FileProperties> = {}
): FileProperties {
  const fileProperties: FileProperties = {
    id: nanoid(16),
    path: 's3://some/path/to/file.jpg',
    type: 'jpg',
  };
  Object.assign(fileProperties, overrides);
  return fileProperties;
}

export function BannerSettingsFake(
  overrides: Partial<BannerSettings> = {}
): BannerSettings {
  const bannerSettings: BannerSettings = {
    skipCount: 1,
    skipRefreshIntervalMilliseconds: 1000 * 60 * 60 * 24,
    acl: [],
  };
  Object.assign(bannerSettings, overrides);
  return bannerSettings;
}

export function BannerMetadataFake(
  overrides: Partial<BannerMetadata> = {}
): BannerMetadata {
  const bannerMetadata: BannerMetadata = {
    marketingTags: [],
  };
  Object.assign(bannerMetadata, overrides);
  return bannerMetadata;
}
