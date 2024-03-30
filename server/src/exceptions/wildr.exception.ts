import { err } from 'neverthrow';
import { Logger } from 'winston';

export type DebugData<ExceptionCode> = {
  context?: string;
  methodName?: string;
  arguments?: any[];
  exceptionCode?: ExceptionCode;
  [key: string]: any;
};

export class WildrException<ExceptionCodeType> extends Error {
  debugData: DebugData<ExceptionCodeType>;
  status: number;
  error?: Error | unknown;
  constructor(
    message: string,
    status?: number,
    debugData?: Partial<DebugData<ExceptionCodeType>>,
    error?: Error | unknown
  ) {
    super(message);
    this.error = error;
    this.status = status || 500;
    this.debugData = { ...debugData };
  }
}

enum UnauthorizedExceptionCodes {}

export class UnauthorizedException extends WildrException<UnauthorizedExceptionCodes> {
  constructor(
    message: string,
    debugData?: Partial<DebugData<UnauthorizedExceptionCodes>>,
    error?: Error | unknown
  ) {
    super(message, 401, debugData, error);
    this.name = 'UnauthorizedException';
  }
}

export enum BadRequestExceptionCodes {
  TROLL_DETECTED_IN_POST = 0,
  TROLL_DETECTED_IN_REPLY = 1,
  TROLL_DETECTED_IN_COMMENT = 2,
  CHALLENGE_DELETED = 3,
  CHALLENGE_ALREADY_REPORTED = 4,
  CHALLENGE_NOT_REPORTED = 5,
  TIMEPOINT_NOTIFICATION_ALREADY_ADDED = 6,
  TIMEPOINT_NOTIFICATION_NOT_SCHEDULED = 7,
  TIMEPOINT_ALREADY_PROCESSED = 8,
  TIMEPOINT_NOT_READY = 9,
  TIMEPOINT_EXPIRED = 10,
  BAD_TIMEZONE_OFFSET = 11,
  ALREADY_JOINED_WILDR_COIN_WAITLIST = 12,
  EMAIL_ALREADY_EXISTS = 13,
}

export class BadRequestException extends WildrException<BadRequestExceptionCodes> {
  constructor(
    message: string,
    debugData?: Partial<DebugData<BadRequestExceptionCodes>>,
    error?: Error | unknown
  ) {
    super(message, 400, debugData, error);
    this.name = 'BadRequestException';
  }
}

export enum NotFoundExceptionCodes {
  USER_NOT_FOUND = 0,
  POST_NOT_FOUND = 1,
  COMMENT_NOT_FOUND = 2,
  REPLY_NOT_FOUND = 3,
  CHALLENGE_NOT_FOUND = 4,
  FEED_NOT_FOUND = 5,
  TIMEPOINT_NOT_FOUND = 6,
  NOTIFICATION_CONFIG_NOT_FOUND = 7,
  MISSING_SSM_PARAMETER = 8,
  GLOBAL_ACTIVE_CHALLENGES_FEED_NOT_FOUND = 9,
  WORKFLOW_CONFIG_NOT_FOUND = 10,
  USER_LIST_NOT_FOUND = 11,
  BANNER_NOT_FOUND = 12,
}

export class NotFoundException extends WildrException<NotFoundExceptionCodes> {
  constructor(
    message: string,
    debugData?: Partial<DebugData<NotFoundExceptionCodes>>,
    error?: Error | unknown
  ) {
    super(message, 404, debugData, error);
    this.name = 'NotFoundException';
  }
}

export enum ForbiddenExceptionCodes {
  LOGIN_REQUIRED = 0,
  FOLLOWING_REQUIRED = 1,
  INNER_CIRCLE_REQUIRED = 2,
  USER_SUSPENDED = 3,
  BLOCKED_FROM_COMMENTING = 4,
  COMMENTS_DISABLED_ON_POST = 5,
  BLOCKED_BY_COMMENT_AUTHOR = 6,
  AUTHOR_REQUIRED = 7,
  CHALLENGE_IN_PROGRESS = 8,
  CHALLENGE_ENDED = 9,
}

export class ForbiddenException extends WildrException<ForbiddenExceptionCodes> {
  constructor(
    message: string,
    debugData?: Partial<DebugData<ForbiddenExceptionCodes>>,
    error?: Error | unknown
  ) {
    super(message, 403, debugData, error);
    this.name = 'ForbiddenException';
  }
}

export enum InternalServerErrorExceptionCodes {
  USER_MISSING_FCM_TOKEN = 0,
  NOTIFICATION_CONFIG_ERROR = 1,
  USER_MISSING_LOCALIZATION_DATA = 2,
  BAD_SSM_PARAMETER = 3,
  POSTGRES_QUERY_FAILED = 4,
  JOB_PRODUCTION_ERROR = 5,
  REDIS_SET_FAILURE = 6,
  REDIS_GET_FAILURE = 7,
  REDIS_JSON_PARSE_FAILURE = 8,
  BAD_WORKFLOW_STATUS_TRANSITION = 9,
  POSTGRES_UPDATE_FAILED = 10,
  POSTGRES_TRANSACTION_FAILED = 11,
  S3_URL_PRESIGN_FAILED = 12,
  POSTGRES_UPSERT_FAILED = 13,
  EMAIL_SEND_ERROR = 14,
  POSTGRES_INSERT_FAILED = 15,
}

export class InternalServerErrorException extends WildrException<InternalServerErrorExceptionCodes> {
  constructor(
    message: string,
    debugData?: Partial<DebugData<InternalServerErrorExceptionCodes>>,
    error?: Error | unknown
  ) {
    super(message, 500, debugData, error);
    this.name = 'InternalServerErrorException';
  }
}

export function isUserVisibleError(error: any) {
  return (
    error instanceof UnauthorizedException ||
    error instanceof BadRequestException ||
    error instanceof NotFoundException ||
    error instanceof ForbiddenException
  );
}

export function logError({
  error,
  logger,
}: {
  error: WildrException<any>;
  logger: Logger;
}) {
  const { message, status, debugData } = error;
  logger.error(message, { status, ...debugData });
}

export function logAndReturnErr({
  error,
  logger,
}: {
  error: WildrException<any>;
  logger: Logger;
}) {
  logError({ error, logger });
  return err(error);
}
