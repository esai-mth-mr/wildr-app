import { IsArray, IsString } from 'class-validator';

export interface BannerParamsDto {
  WILDR_COIN_WAITLIST_BANNER_IDS: string[];
}

export class ProdBannerParamsDto implements BannerParamsDto {
  @IsArray()
  @IsString({ each: true })
  WILDR_COIN_WAITLIST_BANNER_IDS: string[];

  constructor(parsed: any) {
    if (parsed) {
      this.WILDR_COIN_WAITLIST_BANNER_IDS =
        parsed.WILDR_COIN_WAITLIST_BANNER_IDS;
    }
  }
}

export class LocalBannerParamsDto implements BannerParamsDto {
  @IsArray()
  @IsString({ each: true })
  WILDR_COIN_WAITLIST_BANNER_IDS: string[];

  constructor() {
    this.WILDR_COIN_WAITLIST_BANNER_IDS = JSON.parse(
      process.env.WILDR_COIN_WAITLIST_BANNER_IDS || '[]'
    );
  }
}
