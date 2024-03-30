import { IsArray, IsEnum, IsOptional } from 'class-validator';

export enum SuspensionScope {
  ALL = 'ALL',
  USERS = 'USERS',
}

export enum SuspensionOperation {
  REMOVE = 'REMOVE',
  SUSPEND = 'SUSPEND',
}

export class SuspensionRequest {
  @IsEnum(SuspensionScope, { message: 'Please provide ALL or USER' })
  scope: SuspensionScope;
  @IsOptional()
  @IsArray()
  userHandles?: string[];
  @IsEnum(SuspensionOperation, { message: 'Please provide ADD or REMOVE' })
  operation: SuspensionOperation;
}

export interface SuspensionResponse {
  status: 'OK' | 'ERROR';
  message?: string;
  errorMessage?: string;
}
