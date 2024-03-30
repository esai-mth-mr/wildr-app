import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class RedisSetException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('Failed to set redis key', {
      code: InternalServerErrorExceptionCodes.REDIS_SET_FAILURE,
      ...debugData,
    });
  }
}

export class RedisGetException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('Failed to get redis key', {
      code: InternalServerErrorExceptionCodes.REDIS_GET_FAILURE,
      ...debugData,
    });
  }
}

export class RedisJSONParseException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('Failed to parse JSON from redis', {
      code: InternalServerErrorExceptionCodes.REDIS_JSON_PARSE_FAILURE,
      ...debugData,
    });
  }
}
