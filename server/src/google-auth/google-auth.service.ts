import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'GoogleAuthService' });
  }

  async validateToken(token: string): Promise<boolean> {
    const client = new OAuth2Client(/* CLIENT_ID */);
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        //audience: CLIENT_ID,
      });
      const payload = ticket.getPayload();
      this.logger.debug('Verified payload', {
        at_ash: payload?.at_hash,
      });
      return true;
    } catch (error) {
      this.logger.error('Error while validating token', {
        error: error,
      });
      return false;
    }
  }
}
