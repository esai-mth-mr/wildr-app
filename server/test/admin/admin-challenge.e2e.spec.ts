import { INestApplication } from '@nestjs/common';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Connection, Repository } from 'typeorm';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import supertest from 'supertest';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { globalFeaturedChallengesFeedId } from '@verdzie/server/challenge/challenge.service';
import { toFeaturedChallengesIdString } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { AdminChallengeModule } from '@verdzie/server/admin/challenge/admin-challenge.module';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { GenericExceptionFilter } from '@verdzie/server/admin/filters/global-exception.filter';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('AdminChallengeController', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const adminChallengeModule = await createMockedTestingModule({
      imports: [
        WinstonBeanstalkModule.forRoot(),
        WildrBullModule,
        WildrTypeormModule,
        AdminChallengeModule,
      ],
    });
    app = adminChallengeModule.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
    app.useGlobalFilters(new GenericExceptionFilter());
    await app.listen(Number(process.env.ADMIN_HTTP_PORT));
  });

  beforeEach(async () => {
    await conn.getRepository(ChallengeEntity).delete({});
    await conn.getRepository(FeedEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('getFeatured', () => {
    it('should get the list of featured challenges', async () => {
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert(challengeAuthor);
      const challenges = Array.from({ length: 5 }, () =>
        ChallengeEntityFake({
          authorId: challengeAuthor.id,
        })
      );
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const featuredChallengesFeed = FeedEntityFake({
        id: globalFeaturedChallengesFeedId,
      });
      featuredChallengesFeed.page.ids = challenges.slice(0, 3).map(c =>
        toFeaturedChallengesIdString({
          id: c.id,
          endDate: c.endDate,
        })
      );
      featuredChallengesFeed.count = 3;
      await conn.getRepository(FeedEntity).insert(featuredChallengesFeed);
      const response = await supertest(app.getHttpServer())
        .get('/challenge/featured')
        .expect(200);
      expect(response.body).toEqual({
        featuredChallenges: challenges.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
        })),
        updatedAt: featuredChallengesFeed.updatedAt.toISOString(),
      });
    });
  });

  describe('reorderFeatured', () => {
    it('should reorder the featured challenges', async () => {
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert(challengeAuthor);
      const challenges = Array.from({ length: 5 }, () =>
        ChallengeEntityFake({
          authorId: challengeAuthor.id,
        })
      );
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const featuredChallengesFeed = FeedEntityFake({
        id: globalFeaturedChallengesFeedId,
      });
      featuredChallengesFeed.page.ids = challenges.slice(0, 3).map(c =>
        toFeaturedChallengesIdString({
          id: c.id,
          endDate: c.endDate,
        })
      );
      featuredChallengesFeed.count = 3;
      await conn.getRepository(FeedEntity).insert(featuredChallengesFeed);
      await supertest(app.getHttpServer())
        .put('/challenge/featured')
        .send({
          challengeIds: [challenges[2].id, challenges[0].id, challenges[1].id],
          updatedAt: featuredChallengesFeed.updatedAt.toISOString(),
        });
      const updatedFeaturedChallengesFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(globalFeaturedChallengesFeedId);
      expect(updatedFeaturedChallengesFeed.page.ids).toEqual([
        toFeaturedChallengesIdString({
          id: challenges[2].id,
          endDate: challenges[2].endDate,
        }),
        toFeaturedChallengesIdString({
          id: challenges[0].id,
          endDate: challenges[0].endDate,
        }),
        toFeaturedChallengesIdString({
          id: challenges[1].id,
          endDate: challenges[1].endDate,
        }),
      ]);
    });
  });

  describe('takeDown', () => {
    const author = UserEntityFake();
    let repo: Repository<ChallengeEntity>;
    const challenge = ChallengeEntityFake({ authorId: author.id });

    beforeAll(async () => {
      repo = await conn.getRepository(ChallengeEntity);
    });

    // TODO: Figure out why exception is not getting mapped to 404
    it('should not return 200 for non-existing challenge', async () => {
      const id = 'non-existent-challenge-id';
      await supertest(app.getHttpServer())
        .put(`/challenge/${id}/take-down`)
        .send()
        .expect(500);
    });

    it('should take-down an existing challenge', async () => {
      await conn.getRepository(UserEntity).insert(author);
      await repo.insert(challenge);
      const inserted = await repo.findOne(challenge.id);
      expect(inserted?.state).toEqual(ExistenceState.ALIVE);
      await supertest(app.getHttpServer())
        .put(`/challenge/${challenge.id}/take-down`)
        .send()
        .expect(200);
      const updated = await repo.findOne(challenge.id);
      expect(updated?.state).toEqual(ExistenceState.TAKEN_DOWN);
    });
  });
});
