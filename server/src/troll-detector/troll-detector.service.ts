import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface TrollDetectionOverrideData {
  message?: string | null;
  result?: string | null;
}

export interface TrollDetectionOverride {
  name?: TrollDetectionOverrideData | null;
  description?: TrollDetectionOverrideData | null;
}

export interface TrollDetectedError {
  message: string;
  result: string;
}

export interface TrollDetectedInNameError extends TrollDetectedError {
  __typename: 'TrollDetectedInNameError';
}

const isTrollDetectedInNameError = (
  error: any
): error is TrollDetectedInNameError => {
  return error.__typename === 'TrollDetectedInNameError';
};

export interface TrollDetectedInDescriptionError extends TrollDetectedError {
  __typename: 'TrollDetectedInDescriptionError';
}

const isTrollDetectedInDescriptionError = (
  error: any
): error is TrollDetectedInDescriptionError => {
  return error.__typename === 'TrollDetectedInDescriptionError';
};

@Injectable()
export class TrollDetectorService {
  private readonly endpoint: string = '';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'TrollDetectorService' });
    if (
      !process.env.TROLL_SERVER_ENDPOINT ||
      process.env.TROLL_SERVER_ENDPOINT === ''
    ) {
      throw Error('Specify the TROLL_SERVER_ENDPOINT environment variable');
    }
    this.endpoint = process.env.TROLL_SERVER_ENDPOINT;
  }

  async detect(input: string): Promise<string | undefined> {
    if (process.env.TROLL_SERVER_DISABLED === 'true') {
      this.print('Not going to detect any troll');
      return undefined;
    }
    const query = { text: input };
    this.logger.info(
      '[troll-detector.service] Sending request to troll-server',
      {
        endpoint: this.endpoint,
        query: query,
      }
    );
    const config: AxiosRequestConfig = {
      url: this.endpoint,
      method: 'POST',
      data: query,
    };
    try {
      const result = await axios.request(config);
      this.logger.info('Received response from troll-server:', {
        status: result.status,
        text: result.statusText,
        data: result.data,
      });
      const jsonRes = JSON.stringify(result.data);
      const jsonData = JSON.parse(jsonRes);
      if (jsonData.confidence.negative >= 0.5) {
        return jsonRes;
      }
    } catch (err) {
      this.logger.error('Error sending request to troll-server', {
        error: err,
      });
      return undefined;
    }
    return undefined;
  }

  private print(content: string) {
    this.logger.info(content);
  }
}
