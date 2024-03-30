import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OpenSearchParamsDto {
  @IsString()
  OPEN_SEARCH_URL: string | undefined;
  @IsString()
  OPEN_SEARCH_USER: string | undefined;
  @IsString()
  OPEN_SEARCH_PASSWORD: string | undefined;
  @IsString()
  OPEN_SEARCH_USER_QUERY_INDEX: string | undefined;
  @IsOptional()
  @IsString()
  OPEN_SEARCH_EMPTY_USER_QUERY_INDEX: string | undefined;
  @IsString()
  OPEN_SEARCH_POST_QUERY_INDEX: string | undefined;
  @IsOptional()
  @IsString()
  OPEN_SEARCH_EMPTY_POST_QUERY_INDEX: string | undefined;
  @IsArray()
  @IsString({ each: true })
  OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS: string[];
  @IsNumber()
  OPEN_SEARCH_QUERY_SIZE: number;
  @IsNumber()
  OPEN_SEARCH_RE_INDEX_DELAY: number;
  @IsBoolean()
  OPEN_SEARCH_USER_SEARCH_V2_ENABLED: boolean;
  @IsBoolean()
  OPEN_SEARCH_POST_SEARCH_V2_ENABLED: boolean;

  constructor(parsed: any) {
    if (parsed) {
      this.OPEN_SEARCH_URL = parsed.OPEN_SEARCH_URL;
      this.OPEN_SEARCH_USER = parsed.OPEN_SEARCH_USER;
      (this.OPEN_SEARCH_PASSWORD = Buffer.from(
        parsed.OPEN_SEARCH_PASSWORD,
        'base64'
      ).toString('utf8')),
        (this.OPEN_SEARCH_USER_QUERY_INDEX =
          parsed.OPEN_SEARCH_USER_QUERY_INDEX);
      this.OPEN_SEARCH_EMPTY_USER_QUERY_INDEX =
        parsed.OPEN_SEARCH_EMPTY_USER_QUERY_INDEX;
      this.OPEN_SEARCH_POST_QUERY_INDEX = parsed.OPEN_SEARCH_POST_QUERY_INDEX;
      this.OPEN_SEARCH_EMPTY_POST_QUERY_INDEX =
        parsed.OPEN_SEARCH_EMPTY_POST_QUERY_INDEX;
      this.OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS =
        parsed.OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS;
      this.OPEN_SEARCH_QUERY_SIZE = parsed.OPEN_SEARCH_QUERY_SIZE;
      this.OPEN_SEARCH_RE_INDEX_DELAY = parsed.OPEN_SEARCH_RE_INDEX_DELAY;
      this.OPEN_SEARCH_USER_SEARCH_V2_ENABLED =
        parsed.OPEN_SEARCH_USER_SEARCH_V2_ENABLED;
      this.OPEN_SEARCH_POST_SEARCH_V2_ENABLED =
        parsed.OPEN_SEARCH_POST_SEARCH_V2_ENABLED;
    }
  }
}

export class LocalOpenSearchParamsDto {
  @IsString()
  OPEN_SEARCH_URL: string | undefined;
  @IsString()
  OPEN_SEARCH_USER: string | undefined;
  @IsString()
  OPEN_SEARCH_PASSWORD: string | undefined;
  @IsString()
  OPEN_SEARCH_USER_QUERY_INDEX: string | undefined;
  @IsOptional()
  @IsString()
  OPEN_SEARCH_EMPTY_USER_QUERY_INDEX: string | undefined;
  @IsString()
  OPEN_SEARCH_POST_QUERY_INDEX: string | undefined;
  @IsOptional()
  @IsString()
  OPEN_SEARCH_EMPTY_POST_QUERY_INDEX: string | undefined;
  @IsArray()
  @IsString({ each: true })
  OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS: string[];
  @IsNumber()
  OPEN_SEARCH_QUERY_SIZE: number;
  @IsNumber()
  OPEN_SEARCH_RE_INDEX_DELAY: number;
  @IsBoolean()
  OPEN_SEARCH_USER_SEARCH_V2_ENABLED: boolean;
  @IsBoolean()
  OPEN_SEARCH_POST_SEARCH_V2_ENABLED: boolean;

  constructor() {
    this.OPEN_SEARCH_URL = process.env.ES_ENDPOINT;
    this.OPEN_SEARCH_USER = process.env.ES_MASTER;
    this.OPEN_SEARCH_PASSWORD = process.env.ES_PASSWORD;
    this.OPEN_SEARCH_USER_QUERY_INDEX =
      process.env.OPEN_SEARCH_USER_QUERY_INDEX;
    this.OPEN_SEARCH_EMPTY_USER_QUERY_INDEX =
      process.env.OPEN_SEARCH_EMPTY_USER_QUERY_INDEX;
    this.OPEN_SEARCH_POST_QUERY_INDEX =
      process.env.OPEN_SEARCH_POST_QUERY_INDEX;
    this.OPEN_SEARCH_EMPTY_POST_QUERY_INDEX =
      process.env.OPEN_SEARCH_EMPTY_POST_QUERY_INDEX;
    this.OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS = process.env
      .OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS
      ? JSON.parse(process.env.OPEN_SEARCH_POST_EXPLORE_ALLOWED_CATEGORY_IDS)
      : [];
    this.OPEN_SEARCH_QUERY_SIZE = Number(process.env.OPEN_SEARCH_QUERY_SIZE);
    this.OPEN_SEARCH_RE_INDEX_DELAY = Number(
      process.env.OPEN_SEARCH_RE_INDEX_DELAY
    );
    this.OPEN_SEARCH_USER_SEARCH_V2_ENABLED =
      process.env.OPEN_SEARCH_USER_SEARCH_V2_ENABLED === 'true';
    this.OPEN_SEARCH_POST_SEARCH_V2_ENABLED =
      process.env.OPEN_SEARCH_POST_SEARCH_V2_ENABLED === 'true';
  }
}
