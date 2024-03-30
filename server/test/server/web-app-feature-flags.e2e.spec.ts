import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WebAppFeatureFlagsResolverModule } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.resolver.module';
import supertest from 'supertest';

describe('WebAppFeatureFlags', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await createMockedTestingModule({
      imports: [
        WebAppFeatureFlagsResolverModule,
        GraphQLWithUploadModule.forRoot(),
      ],
    });
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getWebAppFeatureFlags', () => {
    const getWebAppFeatureFlagsQuery = /* GraphQL */ `
      query getWebAppFeatureFlags {
        getWebAppFeatureFlags {
          ... on GetWebAppFeatureFlagsResult {
            wildrCoinWaitlistEnabled
          }
        }
      }
    `;

    it('should return the feature flags', async () => {
      const { body } = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getWebAppFeatureFlagsQuery,
        })
        .expect(200);
      expect(body.data.getWebAppFeatureFlags).toEqual({
        wildrCoinWaitlistEnabled: false,
      });
    });
  });
});
