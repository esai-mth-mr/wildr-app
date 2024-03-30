import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import {
  PostCategoryEntity,
  PostCategoryType,
  toPostCategoryTypeLabel,
} from '@verdzie/server/post-category/postCategory.entity';
import { PostCategoryModule } from '@verdzie/server/post-category/postCategory.module';
import { PostCategoryEntityFake } from '@verdzie/server/post-category/testing/postCategory-entity.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection } from 'typeorm';
import supertest from 'supertest';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { getJWT } from '@verdzie/test/utils/auth';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('PostCategory', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        GraphQLWithUploadModule.forRoot(),
        WildrBullModule,
        PostCategoryModule,
        AuthModule,
      ],
    });
    app = module.createNestApplication();
    conn = module.get(Connection);
    await conn.synchronize(true);
    await app.init();
  });

  beforeEach(async () => {
    await conn.getRepository(PostCategoryEntity).delete({});
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('getCategoriesWithTypes', () => {
    const getCategoriesWithTypesQuery = /* GraphQL */ `
      query GetCategoriesWithTypes($input: GetCategoriesWithTypesInput!) {
        getCategoriesWithTypes(input: $input) {
          ... on GetCategoriesWithTypesResult {
            __typename
            categories {
              __typename
              name
              categories {
                __typename
                id
                value
                type
              }
            }
          }
        }
      }
    `;

    it('should get categories with types', async () => {
      await conn.getRepository(PostCategoryEntity).delete({});
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.LIFESTYLE_PERSONAL,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.HEALTH_WELLNESS,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.EDUCATION_LEARNING,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.LEISURE_HOBBIES,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
          deprecated: true,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.FINANCE_INCOME,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getCategoriesWithTypesQuery,
          variables: {
            input: {},
          },
        });
      const resultCategories =
        result.body.data.getCategoriesWithTypes.categories;
      expect(resultCategories).toHaveLength(7);
      const finance = resultCategories[0];
      expect(finance.categories).toHaveLength(1);
      expect(finance.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.FINANCE_INCOME)
      );
      expect(finance.categories[0].id).toEqual(categories[7].id);
      const health = resultCategories[1];
      expect(health.categories).toHaveLength(1);
      expect(health.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.HEALTH_WELLNESS)
      );
      expect(health.categories[0].id).toEqual(categories[2].id);
      const art = resultCategories[2];
      expect(art.categories).toHaveLength(1);
      expect(art.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.ART_ENTERTAINMENT)
      );
      expect(art.categories[0].id).toEqual(categories[0].id);
      const education = resultCategories[3];
      expect(education.categories).toHaveLength(1);
      expect(education.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.EDUCATION_LEARNING)
      );
      expect(education.categories[0].id).toEqual(categories[3].id);
      const lifestyle = resultCategories[4];
      expect(lifestyle.categories).toHaveLength(1);
      expect(lifestyle.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.LIFESTYLE_PERSONAL)
      );
      expect(lifestyle.categories[0].id).toEqual(categories[1].id);
      const leisure = resultCategories[5];
      expect(leisure.categories).toHaveLength(1);
      expect(leisure.name).toEqual(
        toPostCategoryTypeLabel(PostCategoryType.LEISURE_HOBBIES)
      );
      expect(leisure.categories[0].id).toEqual(categories[4].id);
      const misc = resultCategories[6];
      expect(misc.categories).toHaveLength(1);
      expect(misc.name).toEqual(toPostCategoryTypeLabel(PostCategoryType.MISC));
      expect(misc.categories[0].id).toEqual(categories[6].id);
    });

    it('should return categories with group name and value', async () => {
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
          deprecated: true,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getCategoriesWithTypesQuery,
          variables: {
            input: {},
          },
        });
      const resultCategories =
        result.body.data.getCategoriesWithTypes.categories;
      expect(resultCategories).toHaveLength(7);
      const art = resultCategories[2];
      expect(art).toEqual({
        __typename: 'CategoryTypeWithCategories',
        name: toPostCategoryTypeLabel(PostCategoryType.ART_ENTERTAINMENT),
        categories: [
          {
            __typename: 'PostCategory',
            id: categories[0].id,
            type: toPostCategoryTypeLabel(PostCategoryType.ART_ENTERTAINMENT),
            value: categories[0].name,
          },
        ],
      });
      const misc = resultCategories[6];
      expect(misc).toEqual({
        __typename: 'CategoryTypeWithCategories',
        name: toPostCategoryTypeLabel(PostCategoryType.MISC),
        categories: [
          {
            __typename: 'PostCategory',
            id: categories[2].id,
            type: toPostCategoryTypeLabel(PostCategoryType.MISC),
            value: categories[2].name,
          },
        ],
      });
    });
  });

  describe('getCategories', () => {
    const getCategoriesQuery = /* GraphQL */ `
      query GetCategories($input: String!) {
        getCategories(input: $input) {
          ... on GetCategoriesResult {
            __typename
            categories {
              __typename
              id
              value
              type
            }
            userCategoryInterests
          }
        }
      }
    `;

    it('should get categories', async () => {
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.LIFESTYLE_PERSONAL,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.HEALTH_WELLNESS,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.EDUCATION_LEARNING,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
          deprecated: true,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getCategoriesQuery,
          variables: {
            input: 'art',
          },
        });
      const resultCategories = result.body.data.getCategories.categories;
      expect(resultCategories).toHaveLength(5);
      const resultUserCategoryInterests =
        result.body.data.getCategories.userCategoryInterests;
      expect(resultUserCategoryInterests).toHaveLength(0);
    });

    it('should not return deprecated categories', async () => {
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
          deprecated: true,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const userCategoryInterestsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, user.id),
      });
      userCategoryInterestsFeed.page.idsWithScore = {
        idsMap: {
          [categories[0].id]: 1,
        },
      };
      await conn.getRepository(FeedEntity).insert(userCategoryInterestsFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getCategoriesQuery,
          variables: {
            input: 'art',
          },
        });
      const resultCategories = result.body.data.getCategories.categories;
      expect(resultCategories).toHaveLength(2);
      const resultUserCategoryInterests =
        result.body.data.getCategories.userCategoryInterests;
      expect(resultUserCategoryInterests).toHaveLength(1);
      expect(resultUserCategoryInterests[0]).toEqual(categories[0].id);
    });

    it('should not return user category interests related to deprecated categories', async () => {
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
          deprecated: true,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const userCategoryInterestsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, user.id),
      });
      userCategoryInterestsFeed.page.idsWithScore = {
        idsMap: {
          [categories[1].id]: 1,
        },
      };
      await conn.getRepository(FeedEntity).insert(userCategoryInterestsFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getCategoriesQuery,
          variables: {
            input: 'art',
          },
        });
      const resultCategories = result.body.data.getCategories.categories;
      expect(resultCategories).toHaveLength(2);
      const resultUserCategoryInterests =
        result.body.data.getCategories.userCategoryInterests;
      expect(resultUserCategoryInterests).toHaveLength(0);
    });

    it('should order categories by in the specified order by type', async () => {
      const categories = [
        PostCategoryEntityFake({
          _type: PostCategoryType.EDUCATION_LEARNING,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.ART_ENTERTAINMENT,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.MISC,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.HEALTH_WELLNESS,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.LIFESTYLE_PERSONAL,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.FINANCE_INCOME,
        }),
        PostCategoryEntityFake({
          _type: PostCategoryType.LEISURE_HOBBIES,
        }),
      ];
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const userCategoryInterestsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, user.id),
      });
      userCategoryInterestsFeed.page.idsWithScore = {
        idsMap: {
          [categories[0].id]: 1,
        },
      };
      await conn.getRepository(FeedEntity).insert(userCategoryInterestsFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getCategoriesQuery,
          variables: {
            input: 'art',
          },
        });
      const resultCategories = result.body.data.getCategories.categories;
      expect(resultCategories).toHaveLength(7);
      expect(resultCategories[0].id).toEqual(categories[5].id);
      expect(resultCategories[1].id).toEqual(categories[3].id);
      expect(resultCategories[2].id).toEqual(categories[1].id);
      expect(resultCategories[3].id).toEqual(categories[0].id);
      expect(resultCategories[4].id).toEqual(categories[4].id);
      expect(resultCategories[5].id).toEqual(categories[6].id);
      expect(resultCategories[6].id).toEqual(categories[2].id);
    });
  });
});
