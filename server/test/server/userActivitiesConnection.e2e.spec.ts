import { INestApplication } from '@nestjs/common';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { ActivityStreamEntityFake } from '@verdzie/server/activity-stream/testing/activity-stream-entity.fake';
import {
  Activity,
  ActivityObjectType,
  ActivityType,
  ActivityVerb,
} from '@verdzie/server/activity/activity';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { getJWT } from '@verdzie/test/utils/auth';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserActivitiesConnectionModule } from '@verdzie/server/user/resolvers/activities-connection/userActivitiesConnection.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import supertest from 'supertest';
import { Connection } from 'typeorm';
import { UserResolverModule } from '@verdzie/server/user/resolvers/userResolver.module';
import { ReplyEntityFake } from '@verdzie/server/reply/testing/reply-entity.fake';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('UserActivitiesConnection', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        UserResolverModule,
        UserActivitiesConnectionModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('activitiesConnection', () => {
    const activitiesConnectionQuery = /* GraphQL */ `
      query GetUserActivities(
        $input: GetUserInput!
        $paginationInput: PaginationInput!
      ) {
        getUser(input: $input) {
          ... on GetUserResult {
            user {
              id
              activitiesConnection(paginationInput: $paginationInput) {
                pageInfo {
                  startCursor
                  endCursor
                  count
                  totalCount
                  hasNextPage
                  hasPreviousPage
                }
                edges {
                  node {
                    id
                    object {
                      ... on User {
                        id
                      }
                    }
                    displayBodyStr
                    displayStr
                    miscObject {
                      ... on Challenge {
                        id
                        cover {
                          coverImage {
                            thumbnail {
                              source {
                                uri
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('should return info necessary for display of MENTIONED_IN_COMMENT activities', async () => {
      const mentionedUser = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      const userMentioning = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([mentionedUser, challengeAuthor, userMentioning]);
      const parentChallenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      await conn.getRepository(ChallengeEntity).insert(parentChallenge);
      const comment = CommentEntityFake({
        authorId: userMentioning.id,
        challengeId: parentChallenge.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      const activityStream = ActivityStreamEntityFake({ id: mentionedUser.id });
      const mentionedInCommentActivity = new Activity();
      mentionedInCommentActivity.setType(ActivityType.SINGLE);
      mentionedInCommentActivity.challengeId = parentChallenge.id;
      mentionedInCommentActivity.commentId = comment.id;
      mentionedInCommentActivity.objectId = userMentioning.id;
      mentionedInCommentActivity.subjectIds = [userMentioning.id];
      mentionedInCommentActivity.setObjectType(ActivityObjectType.USER);
      mentionedInCommentActivity.setVerb(ActivityVerb.MENTIONED_IN_COMMENT);
      activityStream.activities = [mentionedInCommentActivity];
      await conn.getRepository(ActivityStreamEntity).insert(activityStream);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(mentionedUser)}`)
        .send({
          query: activitiesConnectionQuery,
          variables: {
            input: {
              id: mentionedUser.id,
            },
            paginationInput: {
              take: 10,
            },
          },
        });
      expect(result.body.data.getUser.user.id).toEqual(mentionedUser.id);
      const edges = result.body.data.getUser.user.activitiesConnection.edges;
      expect(edges.length).toEqual(1);
      expect(edges[0].node.miscObject.id).toEqual(parentChallenge.id);
      expect(edges[0].node.object.id).toEqual(userMentioning.id);
      expect(edges[0].node.displayStr).toEqual(
        `${userMentioning.handle} mentioned you in a comment`
      );
      expect(edges[0].node.displayBodyStr).toEqual(
        `Mentioned you in a comment`
      );
    });

    it('should return info necessary for display of MENTIONED_IN_REPLY activities', async () => {
      const mentionedUser = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      const userMentioning = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([mentionedUser, challengeAuthor, userMentioning]);
      const parentChallenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      await conn.getRepository(ChallengeEntity).insert(parentChallenge);
      const comment = CommentEntityFake({
        authorId: challengeAuthor.id,
        challengeId: parentChallenge.id,
      });
      const reply = ReplyEntityFake({
        authorId: userMentioning.id,
        commentId: comment.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      await conn.getRepository(ReplyEntity).insert(reply);
      const activityStream = ActivityStreamEntityFake({ id: mentionedUser.id });
      const mentionedInReplyActivity = new Activity();
      mentionedInReplyActivity.setType(ActivityType.SINGLE);
      mentionedInReplyActivity.challengeId = parentChallenge.id;
      mentionedInReplyActivity.commentId = comment.id;
      mentionedInReplyActivity.replyId = reply.id;
      mentionedInReplyActivity.objectId = userMentioning.id;
      mentionedInReplyActivity.subjectIds = [userMentioning.id];
      mentionedInReplyActivity.setObjectType(ActivityObjectType.USER);
      mentionedInReplyActivity.setVerb(ActivityVerb.MENTIONED_IN_REPLY);
      activityStream.activities = [mentionedInReplyActivity];
      await conn.getRepository(ActivityStreamEntity).insert(activityStream);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(mentionedUser)}`)
        .send({
          query: activitiesConnectionQuery,
          variables: {
            input: {
              id: mentionedUser.id,
            },
            paginationInput: {
              take: 10,
            },
          },
        });
      expect(result.body.data.getUser.user.id).toEqual(mentionedUser.id);
      const edges = result.body.data.getUser.user.activitiesConnection.edges;
      expect(edges.length).toEqual(1);
      expect(edges[0].node.miscObject.id).toEqual(parentChallenge.id);
      expect(edges[0].node.object.id).toEqual(userMentioning.id);
      expect(edges[0].node.displayStr).toEqual(
        `${userMentioning.handle} mentioned you in a reply`
      );
      expect(edges[0].node.displayBodyStr).toEqual(`Mentioned you in a reply`);
    });
  });
});
