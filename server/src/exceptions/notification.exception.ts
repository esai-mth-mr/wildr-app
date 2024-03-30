import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class NotificationCreationBadRequestException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes>) {
    super('notification create error', debugData);
  }
}

export class NotificationCreationInternalErrorException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes>) {
    super('notification create error', debugData);
  }
}
