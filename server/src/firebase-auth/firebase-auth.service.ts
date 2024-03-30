import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as Firebase from 'firebase-admin';
import { auth } from 'firebase-admin';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DecodedIdToken } from 'firebase-admin/lib/auth';
import jwt_decode from 'jwt-decode';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FirebaseAuthService {
  private firebase: Firebase.app.App;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private firebaseService: FirebaseService
  ) {
    this.logger = this.logger.child({ context: 'FirebaseAuthService' });
    this.firebase = firebaseService.app;
  }

  /**
   * @deprecated Use validateFirebaseToken
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const decodedToken = await this.firebase.auth().verifyIdToken(token);
      this.logger.debug('validating token, decoded token', {
        uid: decodedToken.uid,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to verify token ', {
        error,
      });
      return false;
    }
  }

  async validateFirebaseToken(token: string): Promise<string> {
    const decodedToken = this.decodeToken(token);
    this.logger.info('validating firebase token', {
      // @ts-ignore
      sub: decodedToken?.sub,
      // @ts-ignore
      exp: decodedToken?.exp,
      // @ts-ignore
      iat: decodedToken?.iat,
    });
    try {
      return await this.firebase
        .auth()
        .verifyIdToken(token, true)
        .then(decodedToken => {
          if (!decodedToken.email_verified && decodedToken.email) {
            this.logger.error(
              'Logged user out due to email not being verified '
            );
            throw new UnauthorizedException(
              'Please log in again to verify your email.'
            );
          }
          return decodedToken.uid;
        });
    } catch (error: any) {
      this.logger.error('Error validating firebase token. Logging user out ', {
        error,
      });
      if (error.code === 'auth/user-disabled') {
        throw new UnauthorizedException(
          'Your account has just been disabled. Please contact support if you believe this is a mistake.'
        );
      } else if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException(
          'Oops! Something went wrong, please log in again'
        );
      } else throw new UnauthorizedException('Oops! Something went wrong');
    }
  }

  private decodeToken(token: string) {
    try {
      return jwt_decode(token);
    } catch (error) {
      this.logger.error('Error decoding token', { error });
      return {};
    }
  }

  private getTokenExpiry(token: string) {
    try {
      const decodedToken = this.decodeToken(token);
      // @ts-ignore
      return new Date(decodedToken['exp'] * 1000);
    } catch (e) {
      return e;
    }
  }

  async validateTokenAndGetAssociatedAccountDetails(
    token: string
  ): Promise<DecodedIdToken | undefined> {
    const context = {
      methodName: 'validateTokenAndGetAssociatedAccountDetails',
    };
    try {
      return await this.firebase.auth().verifyIdToken(token);
    } catch (error) {
      this.logger.error('failed to verify token ', {
        error,
        ...context,
      });
      return undefined;
    }
  }

  async getUIDByPhoneNumber(phoneNumber: string): Promise<string | undefined> {
    this.logger.debug('PhoneNumber', phoneNumber);
    try {
      const phoneNumberUID = await this.firebase
        .auth()
        .getUserByPhoneNumber(phoneNumber);
      this.logger.debug('phone number exists', phoneNumberUID);
      return phoneNumberUID.uid;
    } catch (e) {
      this.logger.debug("Phone number doesn't exist", e);
      return undefined;
    }
  }

  //Remove a user or Return one!
  async removeUser(uid: string): Promise<boolean> {
    try {
      await this.firebase.auth().deleteUser(uid);
      this.logger.debug('removeUser - user deleted successfully', {
        uid: uid,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to verify token ', { uid, error });
      return false;
    }
  }

  async findUserBy3rdPartyUid(
    providerId: string,
    uid: string
  ): Promise<auth.UserRecord | undefined> {
    return this.firebase
      .auth()
      .getUsers([{ providerUid: uid, providerId: providerId }])
      .then(r => {
        this.logger.debug('requested user by 3rd party id successfully', {
          userData: r,
        });
        return r.users[0];
      })
      .catch(e => {
        this.logger.debug("User doesn't exist", e);
        return undefined;
      });
  }

  async generateFirebaseLink(email: string): Promise<string | undefined> {
    try {
      return await this.firebase.auth().generateEmailVerificationLink(email, {
        url: process.env.WEBSITE_URL ?? 'https://wildr.com',
      });
    } catch (e) {
      this.logger.error('Error when receiving generating email', e);
      return undefined;
    }
  }

  async isEmailVerified(uid: string): Promise<boolean> {
    try {
      const user = await this.firebase.auth().getUser(uid);
      if (!user) return false;
      return user.emailVerified;
    } catch (e) {
      this.logger.error('Error verifying email', { e });
      return false;
    }
  }
}
