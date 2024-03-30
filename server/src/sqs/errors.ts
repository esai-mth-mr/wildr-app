import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
} from '@verdzie/server/exceptions/wildr.exception';

export class BadSQSMessageException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes>) {
    super('bad sqs message ' + debugData.error, debugData);
  }
}
