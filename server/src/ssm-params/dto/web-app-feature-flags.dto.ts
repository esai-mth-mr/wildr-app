import { IsBoolean } from 'class-validator';

export interface WebAppFeatureFlagsDto {
  WILDR_COIN_WAITLIST_ENABLED: boolean;
}

export class ProdWebAppFeatureFlagsDto {
  @IsBoolean()
  readonly WILDR_COIN_WAITLIST_ENABLED: boolean;

  constructor(parsed: any) {
    if (parsed) {
      this.WILDR_COIN_WAITLIST_ENABLED =
        parsed.WILDR_COIN_WAITLIST_ENABLED ?? false;
    }
  }
}

export class DefaultWebAppFeatureFlagsDto implements WebAppFeatureFlagsDto {
  @IsBoolean()
  readonly WILDR_COIN_WAITLIST_ENABLED: boolean;

  constructor() {
    this.WILDR_COIN_WAITLIST_ENABLED = false;
  }
}

export class LocalWebAppFeatureFlagsDto implements WebAppFeatureFlagsDto {
  @IsBoolean()
  readonly WILDR_COIN_WAITLIST_ENABLED: boolean;

  constructor() {
    this.WILDR_COIN_WAITLIST_ENABLED =
      process.env.WILDR_COIN_WAITLIST_ENABLED === 'true';
  }
}
