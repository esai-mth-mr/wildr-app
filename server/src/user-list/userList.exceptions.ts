import {
  DebugData,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class UserListNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('user list not found', {
      code: NotFoundExceptionCodes.USER_LIST_NOT_FOUND,
      debugData,
    });
  }
}
