import { ValidationError } from '@nestjs/common';
import _ from 'lodash';

const getErrorMessage = (error: ValidationError) => {
  //for (const constraint in error.constraints) {
  //  if (constraint === 'isNotEmpty') {
  //    return error.constraints[constraint]
  //  }
  //}
  return _.first(_.valuesIn(error.constraints)) ?? 'Unknown error';
};

export class TrollingDetectedError extends Error {
  constructor(msg: string, public readonly result: string) {
    super(msg);
  }
}

export class CannotCommentError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class ValidationException extends Error {
  public errors: Record<string, string>;

  constructor(validationErrors: ValidationError[]) {
    super();
    this.name = 'ValidationException';
    this.errors = {};
    for (const error of validationErrors) {
      this.errors[error.property] = getErrorMessage(error);
    }
  }
}
