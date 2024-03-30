import { jwtConstants } from '@verdzie/server/auth/constants';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { sign } from 'jsonwebtoken';

export function getJWT(user: UserEntity) {
  return sign({ id: user.id }, jwtConstants.secret, { expiresIn: '1d' });
}
