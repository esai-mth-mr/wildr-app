import { Inject, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AuthService {
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  constructor(private userService: UserService) {}

  async validateUser(email: string, pwd: string): Promise<UserEntity | null> {
    this.logger.debug('[auth.service] Validating user: ', {
      email: email,
    });
    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn('[auth.service] User not found for email: ', email);
      return null;
    }
    this.logger.debug('[auth.service] Found user with handle: ', {
      handle: user.handle,
    });
    const match = await user.checkPassword(pwd);
    if (match === true) {
      return user;
    } else {
      this.logger.warn('[auth.service] Unable to match password');
    }
    return null;
  }
}
