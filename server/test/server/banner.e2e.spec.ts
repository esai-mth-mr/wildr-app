import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import {
  BannerEntity,
  BannerState,
} from '@verdzie/server/banner/banner.entity';
import { BannerResolverModule } from '@verdzie/server/banner/banner.resolver.module';
import {
  BannerContentFake,
  BannerDataFake,
  BannerEntityFake,
  BannerSettingsFake,
} from '@verdzie/server/banner/testing/banner.entity.fake';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { kSomethingWentWrong } from '@verdzie/server/common';
import { wait } from '@verdzie/server/common/transaction-result';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserBannerData, UserEntity } from '@verdzie/server/user/user.entity';
import { getJWT } from '@verdzie/test/utils/auth';
import supertest from 'supertest';
import { Connection, Repository } from 'typeorm';

describe('Banner', () => {
  let app: INestApplication;
  let conn: Connection;
  let bannerRepo: Repository<BannerEntity>;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleRef = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        BannerResolverModule,
      ],
    });
    app = moduleRef.createNestApplication();
    conn = moduleRef.get(Connection);
    await conn.synchronize(true);
    bannerRepo = conn.getRepository(BannerEntity);
    userRepo = conn.getRepository(UserEntity);
    await app.init();
  });

  const cleanDb = async () => {
    await bannerRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
    await app.close();
  });

  describe('getBanners', () => {
    const getBannersQuery = /* GraphQL */ `
      query GetBanners {
        getBanners {
          ... on BannersConnection {
            banners {
              __typename
              id
              title
              description
              cta
              asset {
                __typename
                id
                source {
                  __typename
                  uri
                }
                type
              }
              route {
                __typename
                ... on WalletPageRoute {
                  nestedRoute {
                    __typename
                    ... on WalletTransactionNestedRoute {
                      transactionId
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('returns empty array when no banners', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [],
      });
    });

    it('returns testing banners for users in acl', async () => {
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            settings: BannerSettingsFake({
              acl: [user.id],
            }),
          }),
          state: BannerState.TESTING,
        }),
      ];
      await bannerRepo.insert(banners);
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [
          {
            __typename: 'Banner',
            id: banners[0].id,
            title: banners[0].data.content.title,
            description: banners[0].data.content.description,
            cta: banners[0].data.content.cta,
            asset: {
              __typename: 'Image',
              id: banners[0].data.content.asset.id,
              source: {
                __typename: 'MediaSource',
                uri: banners[0].data.content.asset.path,
              },
              type: 'JPEG',
            },
            route: {
              __typename: 'WalletPageRoute',
              nestedRoute: {
                __typename: 'WalletTransactionNestedRoute',
                transactionId: expect.any(String),
              },
            },
          },
        ],
      });
    });

    it('returns banners for users', async () => {
      const user = UserEntityFake();
      const banners = [BannerEntityFake(), BannerEntityFake()];
      await bannerRepo.insert(banners);
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [
          {
            __typename: 'Banner',
            id: banners[0].id,
            title: banners[0].data.content.title,
            description: banners[0].data.content.description,
            cta: banners[0].data.content.cta,
            asset: {
              __typename: 'Image',
              id: banners[0].data.content.asset.id,
              source: {
                __typename: 'MediaSource',
                uri: banners[0].data.content.asset.path,
              },
              type: 'JPEG',
            },
            route: {
              __typename: 'WalletPageRoute',
              nestedRoute: {
                __typename: 'WalletTransactionNestedRoute',
                transactionId: expect.any(String),
              },
            },
          },
          {
            __typename: 'Banner',
            id: banners[1].id,
            title: banners[1].data.content.title,
            description: banners[1].data.content.description,
            cta: banners[1].data.content.cta,
            asset: {
              __typename: 'Image',
              id: banners[1].data.content.asset.id,
              source: {
                __typename: 'MediaSource',
                uri: banners[1].data.content.asset.path,
              },
              type: 'JPEG',
            },
            route: {
              __typename: 'WalletPageRoute',
              nestedRoute: {
                __typename: 'WalletTransactionNestedRoute',
                transactionId: expect.any(String),
              },
            },
          },
        ],
      });
    });

    it('should not return banners if user has skipped them recently', async () => {
      const user = UserEntityFake();
      const banners = [BannerEntityFake()];
      user.bannerData = {
        bannerInteractions: {
          [banners[0].id]: {
            skipCount: 1,
            lastSkippedAt: new Date().toISOString(),
          },
        },
      };
      await bannerRepo.insert(banners);
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [],
      });
    });

    it('should not return banners if user has already completed them', async () => {
      const user = UserEntityFake();
      const banner = BannerEntityFake({
        data: BannerDataFake({
          settings: BannerSettingsFake({
            skipCount: 1,
            skipRefreshIntervalMilliseconds: 2,
          }),
        }),
      });
      const banners = [banner];
      user.bannerData = {
        bannerInteractions: {
          [banners[0].id]: {
            skipCount: 0,
            lastSkippedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        },
      };
      await bannerRepo.insert(banners);
      await userRepo.insert(user);
      // wait till after skipRefreshIntervalMilliseconds
      await wait(5);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [],
      });
    });

    it('should return banners with page routes', async () => {
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            content: BannerContentFake({
              route: {
                __typename: 'WalletPageRoute',
                nestedRoute: {
                  __typename: 'WalletTransactionNestedRoute',
                  transactionId: '123',
                },
              },
            }),
          }),
        }),
      ];
      await bannerRepo.insert(banners);
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getBannersQuery,
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.getBanners).toEqual({
        banners: [
          {
            __typename: 'Banner',
            id: banners[0].id,
            title: banners[0].data.content.title,
            description: banners[0].data.content.description,
            cta: banners[0].data.content.cta,
            asset: {
              __typename: 'Image',
              id: banners[0].data.content.asset.id,
              source: {
                __typename: 'MediaSource',
                uri: banners[0].data.content.asset.path,
              },
              type: 'JPEG',
            },
            route: {
              __typename: 'WalletPageRoute',
              nestedRoute: {
                __typename: 'WalletTransactionNestedRoute',
                transactionId: '123',
              },
            },
          },
        ],
      });
    });
  });

  describe('skipBanner', () => {
    const skipBannerMutation = /* GraphQL */ `
      mutation SkipBanner($input: SkipBannerInput!) {
        skipBanner(input: $input) {
          ... on SkipBannerResult {
            __typename
            success
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('returns error if user not authenticated', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: skipBannerMutation,
          variables: {
            input: {
              bannerId: '1',
            },
          },
        })
        .expect(200);
      expect(res.body.data.skipBanner).toEqual({
        __typename: 'SkipBannerResult',
        success: false,
      });
    });

    it('returns error if banner not found', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: skipBannerMutation,
          variables: {
            input: {
              bannerId: '1',
            },
          },
        })
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .expect(200);
      expect(res.body.data.skipBanner).toEqual({
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      });
    });

    it('returns success false if user not found', async () => {
      const banner = BannerEntityFake();
      const user = UserEntityFake();
      await bannerRepo.insert(banner);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: skipBannerMutation,
          variables: {
            input: {
              bannerId: banner.id,
            },
          },
        })
        .expect(200);
      expect(res.body.data.skipBanner).toEqual({
        __typename: 'SkipBannerResult',
        success: false,
      });
    });

    it('should return success true if banner skipped', async () => {
      const banner = BannerEntityFake();
      const user = UserEntityFake();
      await bannerRepo.insert(banner);
      await userRepo.insert(user);
      const res = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: skipBannerMutation,
          variables: {
            input: {
              bannerId: banner.id,
            },
          },
        })
        .expect(200);
      expect(res.body.data.skipBanner).toEqual({
        __typename: 'SkipBannerResult',
        success: true,
      });
      const updatedUser = await userRepo.findOneOrFail(user.id);
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          [banner.id]: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(updatedUser.bannerData).toEqual(expectedBannerData);
    });
  });
});
