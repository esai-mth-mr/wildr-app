import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@verdzie/server/app.module';
import { generateId } from '@verdzie/server/common/generateId';
import { ReactionType } from '@verdzie/server/generated-graphql';
import { UserTimezoneUpdateInterceptor } from '@verdzie/server/interceptors/user-timezone-update.interceptor';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PublicPostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { getJWT } from '@verdzie/test/utils/auth';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import supertest from 'supertest';
import { Connection } from 'typeorm';
import { UserTimezoneUpdateProducer } from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';

describe('UserUpdateTimezoneInterceptor', () => {
  let app: INestApplication;
  let module: TestingModule;
  let conn: Connection;
  let interceptor: UserTimezoneUpdateInterceptor;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: UserTimezoneUpdateProducer,
          useValue: {
            createTimezoneUpdateJob: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    interceptor = app.get(UserTimezoneUpdateInterceptor);
    app.useGlobalInterceptors(app.get(UserTimezoneUpdateInterceptor));
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
    await app.listen(process.env.SERVER_HTTP_PORT || 4000);
  });

  beforeEach(async () => {
    await conn.getRepository(PostEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await conn.getRepository(PostEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
    await app.close();
    await module.close();
    await conn.close();
  });

  describe('intercept', () => {
    const reactOnPostMutation = /* GraphQL */ `
      mutation ReactOnPost($reactOnPostInput: ReactOnPostInput!) {
        reactOnPost(input: $reactOnPostInput) {
          __typename
          ... on ReactOnPostResult {
            post {
              id
            }
            challenge {
              id
              authorInteractionsConnection {
                interactionCount
              }
            }
          }
        }
      }
    `;

    it("should update a user's timezone", async () => {
      const user = UserEntityFake({
        localizationData: {},
      });
      const postId = generateId();
      const post = PublicPostEntityFake({
        id: postId,
        authorId: user.id,
      });
      await conn.getRepository(UserEntity).insert(user);
      await conn.getRepository(PostEntity).insert(post);
      interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob = jest
        .fn()
        .mockResolvedValue(null);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .set(TIMEZONE_OFFSET_HEADER, '-02:00')
        .send({
          query: reactOnPostMutation,
          variables: {
            reactOnPostInput: {
              postId,
              reaction: ReactionType.LIKE,
            },
          },
        });
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).toBeCalledTimes(1);
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).toBeCalledWith({
        userId: user.id,
        offset: '-02:00',
      });
    });
  });
});
