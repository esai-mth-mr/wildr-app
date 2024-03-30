import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as firebaseAdmin from 'firebase-admin';
import { auth } from 'firebase-admin';
import { Creator } from '@verdzie/server/admin/creator-users/creator';
import UserRecord = auth.UserRecord;

@Injectable()
export class FirebaseAdminService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'FirebaseAdminService' });
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const users: any[] = [];
      let pageToken: string | undefined = undefined;
      do {
        const response: any = await firebaseAdmin
          .auth()
          .listUsers(1000, pageToken);
        users.push(...response.users);
        pageToken = response.pageToken;
      } while (pageToken);
      return users;
    } catch (error) {
      this.logger.error('getAllUsers', { error });
      return [];
    }
  }

  async createCreatorAccount(creator: Creator): Promise<UserRecord> {
    return await firebaseAdmin.auth().createUser({
      email: creator.email,
      displayName: creator.name,
      emailVerified: true,
      password: creator.email,
      disabled: false,
    });
  }
}
