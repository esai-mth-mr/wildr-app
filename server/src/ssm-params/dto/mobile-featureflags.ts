import { IsBoolean } from 'class-validator';

export class MobileFeatureFlags {
  @IsBoolean()
  createPostV1: boolean;
  @IsBoolean()
  createPostV2: boolean;
  @IsBoolean()
  bannersEnabled: boolean;
  @IsBoolean()
  coinDashboardPart1: boolean;
  @IsBoolean()
  coinDashboardPart2: boolean;
  @IsBoolean()
  videoCompressionRes960x540Quality: boolean;

  constructor(json: {
    CREATE_POST_V1: boolean;
    CREATE_POST_V2: boolean;
    BANNERS_ENABLED?: boolean;
    COIN_DB_PT_1?: boolean;
    COIN_DB_PT_2?: boolean;
    VIDEO_COMPRESSION_960_QUALITY?: boolean;
  }) {
    this.createPostV1 = json?.CREATE_POST_V1;
    this.createPostV2 = json?.CREATE_POST_V2;
    this.bannersEnabled = json?.BANNERS_ENABLED || false;
    this.coinDashboardPart1 = json?.COIN_DB_PT_1 || false;
    this.coinDashboardPart2 = json?.COIN_DB_PT_2 || false;
    this.videoCompressionRes960x540Quality =
      json?.VIDEO_COMPRESSION_960_QUALITY || false;
  }

  allGood(): boolean {
    return this.createPostV1 !== undefined && this.createPostV2 !== undefined;
  }
}

export const DEFAULT_MOBILE_VERSION_FEATURE_FLAGS: MobileFeatureFlags =
  new MobileFeatureFlags({
    CREATE_POST_V1: true,
    CREATE_POST_V2: false,
    BANNERS_ENABLED: false,
    COIN_DB_PT_1: false,
    COIN_DB_PT_2: false,
    VIDEO_COMPRESSION_960_QUALITY: false,
  });
