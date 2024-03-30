import { Injectable } from '@nestjs/common';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import axios, { AxiosInstance } from 'axios';
import https from 'https';

@Injectable()
export class OpenSearchClient {
  client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SSMParamsService.Instance.openSearchParams.OPEN_SEARCH_URL,
      ...((process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'local') && {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
      auth: {
        username:
          SSMParamsService.Instance.openSearchParams.OPEN_SEARCH_USER ?? '',
        password:
          SSMParamsService.Instance.openSearchParams.OPEN_SEARCH_PASSWORD ?? '',
      },
    });
  }
}
