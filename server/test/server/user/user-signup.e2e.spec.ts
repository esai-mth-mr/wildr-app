import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { FirebaseJwtSignupStrategy } from '@verdzie/server/auth/firebase-jwt-signup.strategy';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { FirebaseAuthService } from '@verdzie/server/firebase-auth/firebase-auth.service';
import {
  LinkData,
  LinkSourceType,
  SignUpWithPhoneNumberInput,
} from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserResolverModule } from '@verdzie/server/user/resolvers/userResolver.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserModule } from '@verdzie/server/user/user.module';
import { createFirebaseUserWithEmail } from '@verdzie/test/utils/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';
import { nanoid } from 'nanoid';
import supertest from 'supertest';
import { Connection, Repository } from 'typeorm';

// This is separate from the user tests due to the fact that it requires a
// mocked firebase auth service to be injected into the user module as firebase
// does not allow programmatic phone number sign ups.
describe('User Signup', () => {
  let app: INestApplication;
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;
  let userRepo: Repository<UserEntity>;
  let activityStreamRepo: Repository<ActivityStreamEntity>;

  const phone = faker.phone.phoneNumber();

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        GraphQLWithUploadModule.forRoot(),
        WildrBullModule,
        UserModule,
        UserResolverModule,
      ],
      providers: [
        FirebaseJwtSignupStrategy,
        {
          provide: FirebaseAuthService,
          useValue: {
            validateTokenAndGetAssociatedAccountDetails: jest
              .fn()
              .mockImplementation(async () => {
                const token: DecodedIdToken = {
                  aud: 'aud',
                  auth_time: 1,
                  exp: 1,
                  firebase: {
                    identities: {},
                    sign_in_provider: 'phone',
                  },
                  iat: 1,
                  iss: 'iss',
                  phone_number: phone,
                  sub: phone,
                  uid: phone,
                };
                return token;
              }),
          },
        },
      ],
    });
    conn = module.get(Connection);
    await conn.synchronize(true);
    userRepo = conn.getRepository(UserEntity);
    feedRepo = conn.getRepository(FeedEntity);
    activityStreamRepo = conn.getRepository(ActivityStreamEntity);
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await activityStreamRepo.delete({});
  });

  afterAll(async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await app.close();
    await conn.close();
  });

  describe('signupWithPhoneNumber', () => {
    const signupWithPhoneNumberMutation = /* GraphQL */ `
      mutation SignupWithPhoneNumber($input: SignUpWithPhoneNumberInput!) {
        signUpWithPhoneNumber(input: $input) {
          ... on SignUpOutput {
            user {
              id
            }
          }
        }
      }
    `;

    it('should create a user with the given phone number', async () => {
      const user = UserEntityFake({ phoneNumber: phone });
      const input = {
        handle: user.handle,
        name: user.name,
        fcmToken: nanoid(512),
      };
      const { idToken } = await createFirebaseUserWithEmail(
        faker.internet.email()
      );
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${idToken}`)
        .send({
          query: signupWithPhoneNumberMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          signUpWithPhoneNumber: {
            user: {
              id: expect.any(String),
            },
          },
        },
      });
      const createdUser = await userRepo.findOneOrFail({
        where: { phoneNumber: user.phoneNumber },
      });
      expect(createdUser).toMatchObject({
        id: expect.any(String),
        phoneNumber: user.phoneNumber,
        handle: user.handle,
        name: user.name,
        firebaseUID: phone,
        fcmToken: input.fcmToken,
      });
    });

    it('should create a user with passed in link data', async () => {
      const linkData: LinkData = {
        pseudoUserId: '123',
        linkId: '456',
        refererId: nanoid(16),
        sourceId: '101112',
        sourceType: LinkSourceType.CHALLENGE,
        otherParams: [{ key: 'key', value: 'value' }],
      };
      const input: SignUpWithPhoneNumberInput = {
        handle: 'test',
        name: 'test',
        fcmToken: nanoid(512),
        linkData,
      };
      const { idToken } = await createFirebaseUserWithEmail(
        faker.internet.email()
      );
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${idToken}`)
        .send({
          query: signupWithPhoneNumberMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          signUpWithPhoneNumber: {
            user: {
              id: expect.any(String),
            },
          },
        },
      });
      const createdUser = await userRepo.findOneOrFail({
        where: { phoneNumber: phone },
      });
      const expectedUserData: Partial<UserEntity> = {
        id: expect.any(String),
        handle: input.handle,
        name: input.name,
        firebaseUID: phone,
        refererId: linkData.refererId,
        fcmToken: input.fcmToken,
        signupData: {
          pseudoUserId: linkData.pseudoUserId,
          linkId: linkData.linkId,
          refererId: linkData.refererId,
          sourceId: linkData.sourceId,
          sourceType: 2,
          otherParams: {
            key: 'value',
          },
        },
      };
      expect(createdUser).toMatchObject(expectedUserData);
    });
  });
});
