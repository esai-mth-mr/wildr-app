import { UserEntity } from '../user/user.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export interface RealIdResponse {
  status: 'OK' | 'ERROR';
  users?: UserEntity[];
  errorMessage?: string;
}
export enum RealIdOperation {
  VERIFY = 'VERIFY',
  REJECT = 'REJECT',
}
export class RealIdRequest {
  @IsString()
  id: string;
  @IsEnum(RealIdOperation, { message: 'Please provide VERIFY or REJECT' })
  operation: RealIdOperation;
  @IsOptional()
  @IsString()
  message: string;
}
