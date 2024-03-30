import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
} from '@verdzie/server/exceptions/wildr.exception';

export class UserWithEmailAlreadyExistsException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('user with email already exists', {
      ...debugData,
      code: BadRequestExceptionCodes.EMAIL_ALREADY_EXISTS,
    });
  }
}
