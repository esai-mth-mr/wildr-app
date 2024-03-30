import { UserEntity } from '../user/user.entity';

export interface UserResponse {
  status: 'OK' | 'ERROR';
  user?: UserEntity;
  errorMessage?: string;
}
