import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class SSMParamNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes>) {
    super('missing ssm parameter', {
      ...debugData,
      code: NotFoundExceptionCodes.MISSING_SSM_PARAMETER,
    });
  }
}

export class BadSSMParamException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes>) {
    super('invalid ssm parameter', {
      ...debugData,
      code: InternalServerErrorExceptionCodes.BAD_SSM_PARAMETER,
    });
  }
}
