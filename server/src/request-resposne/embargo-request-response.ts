import { IsArray, IsEnum, IsOptional } from 'class-validator';

export enum EmbargoScope {
  ALL = 'ALL',
  USERS = 'USERS',
}

export enum EmbargoOperation {
  CREATE = 'CREATE',
  REMOVE = 'REMOVE',
}

export class LiftEmbargoRequest {
  @IsEnum(EmbargoScope, { message: 'Please provide the scope (ALL/USERS)' })
  scope: EmbargoScope;
  @IsOptional()
  @IsArray()
  userHandles?: string[];
  @IsEnum(EmbargoOperation, {
    message: 'Please provide operation (CREATE/REMOVE)',
  })
  operation: EmbargoOperation;
}

export interface LiftEmbargoResponse {
  status: 'OK' | 'ERROR';
  errorMessage?: string;
  message?: string;
}
