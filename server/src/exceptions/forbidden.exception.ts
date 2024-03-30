import {
  DebugData,
  ForbiddenException,
  ForbiddenExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class LoginRequiredException extends ForbiddenException {
  constructor(debugData: DebugData<ForbiddenExceptionCodes> = {}) {
    super('Login required!', {
      ...debugData,
      exceptionCode: ForbiddenExceptionCodes.LOGIN_REQUIRED,
    });
  }
}
