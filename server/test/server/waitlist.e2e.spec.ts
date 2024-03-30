import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { WaitlistType as GqlWaitlistType } from '@verdzie/server/generated-graphql';
import { WaitlistType } from '@verdzie/server/waitlist/waitlist.entity';
import { getJWT } from '@verdzie/test/utils/auth';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WaitlistEntity } from '@verdzie/server/waitlist/waitlist.entity';
import { WaitlistResolverModule } from '@verdzie/server/waitlist/waitlist.resolver.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import supertest from 'supertest';
import { Connection, Repository } from 'typeorm';
import { waitlistCopyMap } from '@verdzie/server/waitlist/waitlist.copy';
import { WildrLanguageCode } from '@verdzie/server/common/language-code';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('Waitlist (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;
  let userRepo: Repository<UserEntity>;
  let waitlistRepo: Repository<WaitlistEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        WaitlistResolverModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    userRepo = conn.getRepository(UserEntity);
    waitlistRepo = conn.getRepository(WaitlistEntity);
    await conn.synchronize(true);
    await app.init();
  });

  const cleanDb = async () => {
    await waitlistRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(cleanDb);

  afterAll(async () => {
    await cleanDb();
    await app.close();
    await conn.close();
  });

  describe('addUserToWaitlist', () => {
    const addUserToWaitlistMutation = /* GraphQL */ `
      mutation AddUserToWaitlist($input: AddUserToWaitlistInput!) {
        addUserToWaitlist(input: $input) {
          ... on AddUserToWaitlistResult {
            success
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should add user to waitlist', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: addUserToWaitlistMutation,
          variables: {
            input: {
              waitlistType: GqlWaitlistType.WILDRCOIN,
            },
          },
        })
        .expect(200);
      expect(result.body.data.addUserToWaitlist.success).toBe(true);
      const updatedUser = await userRepo.findOneOrFail(user.id);
      expect(updatedUser.wildrcoinData?.waitlistParticipationEvents).toEqual([
        {
          __typename: 'WildrcoinWaitlistJoinEvent',
          createdAt: expect.any(String),
        },
      ]);
    });

    it('should return an error if the user is already on the waitlist', async () => {
      const user = UserEntityFake();
      user.joinWildrCoinWaitlist();
      await userRepo.insert(user);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: addUserToWaitlistMutation,
          variables: {
            input: {
              waitlistType: GqlWaitlistType.WILDRCOIN,
            },
          },
        })
        .expect(200);
      expect(result.body.data.addUserToWaitlist.message).toBe(
        waitlistCopyMap[WildrLanguageCode.ENGLISH]
          .alreadyJoinedWaitlistExceptionMessage
      );
    });
  });

  describe('addEmailToWaitlist', () => {
    const addEmailToWaitlistMutation = /* GraphQL */ `
      mutation AddEmailToWaitlist($input: AddEmailToWaitlistInput!) {
        addEmailToWaitlist(input: $input) {
          ... on AddEmailToWaitlistResult {
            success
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should add email to waitlist', async () => {
      const email = 'email@email.com';
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: addEmailToWaitlistMutation,
          variables: {
            input: {
              email,
              waitlistType: GqlWaitlistType.WILDRCOIN,
            },
          },
        })
        .expect(200);
      expect(result.body.data.addEmailToWaitlist.success).toBe(true);
      const updatedWaitlist = await waitlistRepo.findOneOrFail({
        where: {
          email,
          waitlistType: WaitlistType.WILDRCOIN,
        },
      });
      expect(updatedWaitlist).toBeDefined();
    });

    // We don't want to show an error as it would allow bad actors to check if
    // an email is on the waitlist
    it('should not error if user is already on waitlist', async () => {
      const email = 'email@email.com';
      await waitlistRepo.insert({
        email,
        waitlistType: WaitlistType.WILDRCOIN,
      });
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: addEmailToWaitlistMutation,
          variables: {
            input: {
              email,
              waitlistType: GqlWaitlistType.WILDRCOIN,
            },
          },
        })
        .expect(200);
      expect(result.body.data.addEmailToWaitlist.success).toBe(true);
      const updatedWaitlist = await waitlistRepo.findOneOrFail({
        where: {
          email,
          waitlistType: WaitlistType.WILDRCOIN,
        },
      });
      expect(updatedWaitlist).toBeDefined();
    });
  });
});
