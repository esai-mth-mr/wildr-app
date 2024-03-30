import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

export class PostgresQueryFailedException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('query failed', {
      ...debugData,
      exceptionCode: InternalServerErrorExceptionCodes.POSTGRES_QUERY_FAILED,
    });
  }
}

export class PostgresInsertFailedException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('insert failed', {
      ...debugData,
      exceptionCode: InternalServerErrorExceptionCodes.POSTGRES_INSERT_FAILED,
    });
  }
}

export class PostgresUpdateFailedException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('update query failed', {
      ...debugData,
      exceptionCode: InternalServerErrorExceptionCodes.POSTGRES_UPDATE_FAILED,
    });
  }
}

export class PostgresUpsertFailedException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('upsert query failed', {
      ...debugData,
      exceptionCode: InternalServerErrorExceptionCodes.POSTGRES_UPSERT_FAILED,
    });
  }
}

export class PostgresTransactionFailedException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('transaction failed', {
      ...debugData,
      exceptionCode:
        InternalServerErrorExceptionCodes.POSTGRES_TRANSACTION_FAILED,
    });
  }
}
