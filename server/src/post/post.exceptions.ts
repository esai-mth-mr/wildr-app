import {
  DebugData,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class PostNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('Post not found', {
      ...debugData,
      code: NotFoundExceptionCodes.POST_NOT_FOUND,
    });
  }
}
