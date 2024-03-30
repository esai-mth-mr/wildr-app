import { PageRoute } from '@verdzie/server/generated-graphql';
import { FileProperties } from '@verdzie/server/post/postProperties';

export class BannerEntity {
  static readonly kTableName = 'banner_entity';
  static readonly kEntityName = 'BannerEntity';
  static readonly kFields = {
    id: 'id',
    data: 'data',
    state: 'state',
    countryCode: 'country_code',
    startDate: 'start_date',
    endDate: 'end_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  id: string;
  data: BannerData;
  state: BannerState;
  countryCode?: CountryCode;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(opts: Partial<BannerEntity> = {}) {
    this.id = opts.id || '';
    this.data = opts.data || {
      content: {
        title: '',
        description: '',
        cta: '',
        asset: {
          id: '',
          path: '',
          type: '',
        },
        route: {
          __typename: 'WalletPageRoute',
          nestedRoute: {
            __typename: 'WalletTransactionNestedRoute',
            transactionId: '',
          },
        },
      },
      settings: {
        skipCount: 0,
        skipRefreshIntervalMilliseconds: 1000 * 60 * 60 * 24,
        acl: [],
      },
      metadata: {
        marketingTags: [],
      },
    };
    this.state = opts.state || BannerState.ENABLED;
    this.countryCode = opts.countryCode;
    this.startDate = opts.startDate;
    this.endDate = opts.endDate;
    this.createdAt = opts.createdAt || new Date();
    this.updatedAt = opts.updatedAt || new Date();
  }
}

export interface BannerData {
  content: BannerContent;
  settings: BannerSettings;
  metadata: BannerMetadata;
}

export interface BannerContent {
  title: string;
  description: string;
  cta: string;
  asset: FileProperties;
  route: PageRoute;
}

export interface BannerSettings {
  skipCount: number;
  skipRefreshIntervalMilliseconds: number;
  acl?: string[];
}

export interface BannerMetadata {
  marketingTags: string[];
}

enum CountryCode {
  US = 1,
  IN = 91,
}

export enum BannerState {
  TESTING = 0,
  ENABLED = 1,
  DISABLED = 2,
  ARCHIVED = 3,
}
