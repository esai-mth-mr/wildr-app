import { TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { ReactionType } from '@verdzie/server/generated-graphql';
import { ActivityStreamEntityFake } from '@verdzie/server/activity-stream/testing/activity-stream-entity.fake';
import { ActivityData } from '@verdzie/server/activity/activity-common';
import { ReplyEntityFake } from '@verdzie/server/reply/testing/reply-entity.fake';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  Activity,
  ActivityObjectType,
  ActivityType,
  ActivityVerb,
} from '@verdzie/server/activity/activity';
import { ActivityFake } from '@verdzie/server/activity/testing/activity.fake';
import { generateId } from '@verdzie/server/common/generateId';
import { PostRepository } from '@verdzie/server/post/post-repository/post.repository';
import {
  NotifyAuthorAboutReactionOnCommentJob,
  NotifyAuthorAboutReactionOnReplyJob,
} from '@verdzie/server/worker/notify-author/notifyAuthor.producer';

describe('ActivityService', () => {
  let service: ActivityService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await createMockedTestingModule({
      providers: [ActivityService],
    });
    service = module.get(ActivityService);
  });

  afterAll(async () => await module.close());

  describe('reactOnComment', () => {
    describe('like', () => {
      it('should get the correct author and activity stream', async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
        });
        const subject = UserEntityFake();
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        expect(service['userService'].findById).toHaveBeenCalledWith(
          subject.id
        );
        expect(service['activityStreamService'].findById).toHaveBeenCalledWith(
          commentAuthor.activityStreamId
        );
      });

      it(`should add a new activity to the mentioned user's activity stream`, async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({
          activityStreamId: activityStreamId,
        });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
          activities: [],
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
          challengeId: generateId(),
        });
        const subject = UserEntityFake();
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        const activityStreamUpdateCallArgs =
          activityStreamRepo.update.mock.calls[0];
        expect(activityStreamUpdateCallArgs[0]).toEqual(activityStream.id);
        expect(activityStreamUpdateCallArgs[1].activities).toHaveLength(1);
        const firstActivity = activityStreamUpdateCallArgs[1].activities[0];
        expect(firstActivity).toEqual(
          expect.objectContaining({
            id: firstActivity.id,
            createdAt: firstActivity.createdAt,
            subjectIds: [subject.id],
            metaEvent: 0,
            type: 1,
            objectId: comment.id,
            objectType: ActivityObjectType.COMMENT,
            verb: ActivityVerb.REACTION_LIKE,
            commentId: comment.id,
            postId: comment.postId,
            challengeId: comment.challengeId,
          } as Activity)
        );
      });

      it(`should add the new activity to the comment's activity data`, async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
          activities: [],
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
        });
        const subject = UserEntityFake();
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        const commentUpdateCallArgs = commentRepo.update.mock.calls[0];
        expect(commentUpdateCallArgs[0]).toEqual(comment.id);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids
        ).toHaveLength(1);
      });

      it(`should aggregate the activityItemData if there are enough ids`, async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
          activities: [],
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
          activityData: {
            reactionLikeAD: {
              type: 'ActivityItemData',
              ids: ['1', '2', '3', '4', '5'],
              isAggregated: false,
            },
          } as ActivityData,
        });
        const subject = UserEntityFake();
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        const commentUpdateCallArgs = commentRepo.update.mock.calls[0];
        const activityStreamUpdateCallArgs =
          activityStreamRepo.update.mock.calls[0];
        expect(commentUpdateCallArgs[0]).toEqual(comment.id);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids
        ).toHaveLength(2);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids[0]
        ).toEqual(activityStreamUpdateCallArgs[1].activities[0].id);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids[1]
        ).toEqual('5');
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.isAggregated
        ).toBe(true);
      });

      it(`should add to the comment's aggregated activityItemData`, async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
          activities: [],
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
          activityData: {
            reactionLikeAD: {
              type: 'ActivityItemData',
              ids: ['1', '2', '2', '3', '4', '5'],
              isAggregated: true,
            },
          } as ActivityData,
        });
        const subject = UserEntityFake();
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        const commentUpdateCallArgs = commentRepo.update.mock.calls[0];
        const activityStreamUpdateCallArgs =
          activityStreamRepo.update.mock.calls[0];
        expect(commentUpdateCallArgs[0]).toEqual(comment.id);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids
        ).toHaveLength(7);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids[6]
        ).toEqual(activityStreamUpdateCallArgs[1].activities[0].id);
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.ids[1]
        ).toEqual('2');
        expect(
          commentUpdateCallArgs[1].activityData.reactionLikeAD.isAggregated
        ).toBe(true);
      });

      it(`should send a notification to the comment author`, async () => {
        const activityStreamId = '123';
        const commentAuthor = UserEntityFake({
          activityStreamId,
          fcmToken: 'fcm-token',
        });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
          activities: [],
        });
        const comment = CommentEntityFake({
          authorId: commentAuthor.id,
          author: commentAuthor,
          activityData: {
            reactionLikeAD: {
              type: 'ActivityItemData',
              ids: ['1', '2', '2', '3', '4', '5'],
              isAggregated: true,
            },
          } as ActivityData,
          challengeId: 'challenge-id',
        });
        service['commentService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(comment);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const commentRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'CommentEntity') {
              return commentRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const subject = UserEntityFake();
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        const job: NotifyAuthorAboutReactionOnCommentJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnComment(job);
        expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
          commentAuthor.fcmToken,
          `${subject.handle} liked your comment `,
          {
            body: `${subject.handle} liked your comment `,
            postId: comment.postId,
            commentId: comment.id,
            challengeId: comment.challengeId,
            verb: 'REACTION_LIKE',
          }
        );
      });
    });
  });

  describe('reactOnReply', () => {
    describe('like', () => {
      it('should get the correct author and activity stream', async () => {
        const activityStreamId = '123';
        const replyAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
        });
        const comment = CommentEntityFake();
        const reply = ReplyEntityFake({
          authorId: replyAuthor.id,
          author: replyAuthor,
        });
        service['userService'].findById = jest
          .fn()
          .mockResolvedValue(replyAuthor);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        service['commentService'].findById = jest
          .fn()
          .mockResolvedValue(comment);
        service['replyService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(reply);
        const replyRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'ReplyEntity') {
              return replyRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const subject = UserEntityFake();
        const job: NotifyAuthorAboutReactionOnReplyJob = {
          reactionType: ReactionType.LIKE,
          replyId: reply.id,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnReply(job);
        expect(service['userService'].findById).toHaveBeenCalledWith(
          subject.id
        );
        expect(service['activityStreamService'].findById).toHaveBeenCalledWith(
          replyAuthor.activityStreamId
        );
      });

      it(`should add the new activity to the reply's activity data`, async () => {
        const activityStreamId = '123';
        const replyAuthor = UserEntityFake({ activityStreamId });
        const activityStream = ActivityStreamEntityFake({
          activities: [],
          id: activityStreamId,
        });
        const comment = CommentEntityFake();
        const reply = ReplyEntityFake({
          authorId: replyAuthor.id,
          author: replyAuthor,
        });
        service['userService'].findById = jest
          .fn()
          .mockResolvedValue(replyAuthor);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        service['commentService'].findById = jest
          .fn()
          .mockResolvedValue(comment);
        service['replyService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(reply);
        const replyRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'ReplyEntity') {
              return replyRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(async tx => {
                return await tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const subject = UserEntityFake();
        const job: NotifyAuthorAboutReactionOnReplyJob = {
          reactionType: ReactionType.LIKE,
          replyId: reply.id,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        await service.reactOnReply(job);
        const replyUpdateCall = replyRepo.update.mock.calls[0];
        expect(replyUpdateCall[0]).toEqual(reply.id);
        expect(replyUpdateCall[1].activityData.reactionLikeAD.ids).toHaveLength(
          1
        );
      });

      it(`should add a new Activity to the reply's activity stream`, async () => {
        const replyAuthor = UserEntityFake();
        const activityStream = ActivityStreamEntityFake({ activities: [] });
        const comment = CommentEntityFake({
          challengeId: generateId(),
        });
        const reply = ReplyEntityFake({
          authorId: replyAuthor.id,
          author: replyAuthor,
        });
        const subject = UserEntityFake();
        service['replyService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(reply);
        service['commentService'].findById = jest
          .fn()
          .mockResolvedValue(comment);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        const replyRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'ReplyEntity') {
              return replyRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(async tx => {
                return await tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnReplyJob = {
          reactionType: ReactionType.LIKE,
          commentId: comment.id,
          replyId: reply.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnReply(job);
        const activityStreamUpdateCallArgs =
          activityStreamRepo.update.mock.calls[0];
        expect(activityStreamUpdateCallArgs[0]).toEqual(activityStream.id);
        expect(activityStreamUpdateCallArgs[1].activities).toHaveLength(1);
        const firstActivity = activityStreamUpdateCallArgs[1].activities[0];
        expect(firstActivity).toEqual(
          expect.objectContaining({
            id: firstActivity.id,
            createdAt: firstActivity.createdAt,
            subjectIds: [subject.id],
            metaEvent: 0,
            type: 1,
            objectId: reply.id,
            objectType: ActivityObjectType.REPLY,
            verb: ActivityVerb.REACTION_LIKE,
            replyId: reply.id,
            commentId: comment.id,
            postId: comment.postId,
            challengeId: comment.challengeId,
          } as Activity)
        );
      });

      it('should send a notification to the reply author', async () => {
        const activityStreamId = '123';
        const replyAuthor = UserEntityFake({
          activityStreamId,
          fcmToken: '123',
        });
        const activityStream = ActivityStreamEntityFake({
          id: activityStreamId,
        });
        const comment = CommentEntityFake({ challengeId: 'challengeId' });
        const reply = ReplyEntityFake({
          authorId: replyAuthor.id,
          author: replyAuthor,
        });
        const subject = UserEntityFake();
        service['commentService'].findById = jest
          .fn()
          .mockResolvedValue(comment);
        service['replyService'].findByIdWithAuthor = jest
          .fn()
          .mockResolvedValue(reply);
        service['userService'].findById = jest.fn().mockResolvedValue(subject);
        service['activityStreamService'].findById = jest
          .fn()
          .mockResolvedValue(activityStream);
        const replyRepo = { update: jest.fn() };
        const activityStreamRepo = { update: jest.fn() };
        const transactionManager = {
          getRepository: jest.fn().mockImplementation(targetEntity => {
            if (targetEntity.name === 'ReplyEntity') {
              return replyRepo;
            } else if (targetEntity.name === 'ActivityStreamEntity') {
              return activityStreamRepo;
            } else {
              throw new Error(`Unknown entity ${targetEntity}`);
            }
          }),
        };
        // @ts-ignore
        service['postService']['repo'] = {
          repository: {
            manager: {
              transaction: jest.fn().mockImplementation(tx => {
                tx(transactionManager);
              }),
            },
          },
        } as PostRepository;
        const job: NotifyAuthorAboutReactionOnReplyJob = {
          reactionType: ReactionType.LIKE,
          replyId: reply.id,
          commentId: comment.id,
          subjectId: subject.id,
          timeStamp: new Date(),
        };
        await service.reactOnReply(job);
        expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
          replyAuthor.fcmToken,
          `${subject.handle} liked your reply `,
          {
            body: `${subject.handle} liked your reply `,
            commentId: comment.id,
            challengeId: comment.challengeId,
            replyId: reply.id,
            verb: 'REACTION_LIKE',
          }
        );
      });
    });
  });

  describe('commentOnChallenge', () => {
    it(`should retrieve the challenge and challenge author's activity stream`, async () => {
      const challengeAuthorActivityStream = ActivityStreamEntityFake({
        activities: [],
      });
      const challengeAuthor = UserEntityFake({
        activityStreamId: challengeAuthorActivityStream.id,
        activityStream: challengeAuthorActivityStream,
      });
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const commentAuthor = UserEntityFake();
      const comment = CommentEntityFake({
        authorId: commentAuthor.id,
        challengeId: challenge.id,
        author: commentAuthor,
      });
      service['commentService'].findByIdWithAuthor = jest
        .fn()
        .mockImplementation(async id => {
          return [comment].find(c => c.id === id);
        });
      const challengeRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challenge].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const userRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challengeAuthor].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === ChallengeEntity) {
            return challengeRepo;
          } else if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          } else {
            console.log('Unknown entity', entity);
          }
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.commentOnChallenge({ commentId: comment.id });
      expect(userRepo.findOne).toHaveBeenCalledWith(challengeAuthor.id, {
        relations: ['activityStream'],
      });
    });

    it(`should update the author's activity stream`, async () => {
      const challengeAuthorActivityStream = ActivityStreamEntityFake({
        activities: [],
      });
      const challengeAuthor = UserEntityFake({
        activityStreamId: challengeAuthorActivityStream.id,
        activityStream: challengeAuthorActivityStream,
      });
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const commentAuthor = UserEntityFake();
      const comment = CommentEntityFake({
        authorId: commentAuthor.id,
        challengeId: challenge.id,
        author: commentAuthor,
      });
      service['commentService'].findByIdWithAuthor = jest
        .fn()
        .mockImplementation(async id => {
          return [comment].find(c => c.id === id);
        });
      const challengeRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challenge].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const userRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challengeAuthor].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === ChallengeEntity) {
            return challengeRepo;
          } else if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          } else {
            console.log('Unknown entity', entity);
          }
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.commentOnChallenge({ commentId: comment.id });
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0][1];
      expect(activityStreamUpdate.activities).toHaveLength(1);
      expect(activityStreamUpdate.activities[0]).toEqual(
        expect.objectContaining({
          subjectIds: [commentAuthor.id],
          metaEvent: 0,
          type: ActivityType.SINGLE,
          objectId: challenge.id,
          objectType: ActivityObjectType.CHALLENGE,
          verb: ActivityVerb.COMMENTED,
          challengeId: challenge.id,
          commentId: comment.id,
        })
      );
    });

    it(`should update the challenges activity data`, async () => {
      const challengeAuthorActivityStream = ActivityStreamEntityFake({
        activities: [],
      });
      const challengeAuthor = UserEntityFake({
        activityStreamId: challengeAuthorActivityStream.id,
        activityStream: challengeAuthorActivityStream,
      });
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const commentAuthor = UserEntityFake();
      const comment = CommentEntityFake({
        authorId: commentAuthor.id,
        challengeId: challenge.id,
        author: commentAuthor,
      });
      service['commentService'].findByIdWithAuthor = jest
        .fn()
        .mockImplementation(async id => {
          return [comment].find(c => c.id === id);
        });
      const challengeRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challenge].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const userRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challengeAuthor].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === ChallengeEntity) {
            return challengeRepo;
          } else if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          } else {
            console.log('Unknown entity', entity);
          }
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.commentOnChallenge({ commentId: comment.id });
      const challengeUpdate = challengeRepo.update.mock.calls[0];
      expect(challengeUpdate[0]).toEqual(challenge.id);
      expect(challengeUpdate[1]).toEqual(
        expect.objectContaining({
          activityData: expect.objectContaining({
            commentAD: expect.objectContaining({
              type: 'ActivityItemData',
              isAggregated: false,
              ids: expect.arrayContaining([expect.anything()]),
            }),
          }),
        })
      );
    });

    it('should send notification with expected text', async () => {
      const challengeAuthorActivityStream = ActivityStreamEntityFake({
        activities: [],
      });
      const challengeAuthor = UserEntityFake({
        activityStreamId: challengeAuthorActivityStream.id,
        activityStream: challengeAuthorActivityStream,
      });
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const commentAuthor = UserEntityFake();
      const comment = CommentEntityFake({
        authorId: commentAuthor.id,
        challengeId: challenge.id,
        author: commentAuthor,
      });
      service['commentService'].findByIdWithAuthor = jest
        .fn()
        .mockImplementation(async id => {
          return [comment].find(c => c.id === id);
        });
      const challengeRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challenge].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const userRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challengeAuthor].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === ChallengeEntity) {
            return challengeRepo;
          } else if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          } else {
            console.log('Unknown entity', entity);
          }
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.commentOnChallenge({ commentId: comment.id });
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        challengeAuthor.fcmToken,
        `${commentAuthor.handle} commented on your challenge `,
        {
          body: `${commentAuthor.handle} commented on your challenge `,
          challengeId: challenge.id,
          commentId: comment.id,
          subjectId: commentAuthor.id,
          objectId: challenge.id,
          objectType: String(ActivityObjectType.CHALLENGE),
          verb: 'COMMENTED',
        }
      );
    });

    it('should send not send the notification if comment author is challenge author', async () => {
      const challengeAuthorActivityStream = ActivityStreamEntityFake({
        activities: [],
      });
      const challengeAuthor = UserEntityFake({
        activityStreamId: challengeAuthorActivityStream.id,
        activityStream: challengeAuthorActivityStream,
      });
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const comment = CommentEntityFake({
        authorId: challengeAuthor.id,
        challengeId: challenge.id,
        author: challengeAuthor,
      });
      service['commentService'].findByIdWithAuthor = jest
        .fn()
        .mockImplementation(async id => {
          return [comment].find(c => c.id === id);
        });
      const challengeRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challenge].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const userRepo = {
        findOne: jest.fn().mockImplementation(async id => {
          return [challengeAuthor].find(c => c.id === id);
        }),
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === ChallengeEntity) {
            return challengeRepo;
          } else if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          } else {
            console.log('Unknown entity', entity);
          }
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.commentOnChallenge({ commentId: comment.id });
      expect(service['fcmService'].sendNotification).not.toHaveBeenCalled();
      expect(challengeRepo.update).not.toHaveBeenCalled();
      expect(activityStreamRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('participantJoinedChallenge', () => {
    it('should update the authors activity stream', async () => {
      const participant = UserEntityFake();
      const author = UserEntityFake({
        activityStream: ActivityStreamEntityFake(),
      });
      const challenge = ChallengeEntityFake({ authorId: author.id });
      service['userService'].findById = jest
        .fn()
        .mockResolvedValue(participant);
      const userRepo = { findOne: jest.fn().mockResolvedValue(author) };
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValue(challenge),
        update: jest.fn(),
      };
      const activityStreamRepo = { update: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) return userRepo;
          if (entity === ActivityStreamEntity) return activityStreamRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.participantJoinedChallenge({
        participantId: participant.id,
        challengeId: challenge.id,
      });
      expect(service['userService'].findById).toHaveBeenCalledWith(
        participant.id
      );
      expect(challengeRepo.findOne).toHaveBeenCalledWith(challenge.id);
      expect(userRepo.findOne).toHaveBeenCalledWith(author.id, {
        relations: ['activityStream'],
      });
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      expect(activityStreamUpdate[0]).toEqual(author.activityStream?.id);
      expect(activityStreamUpdate[1].activities).toHaveLength(1);
      expect(activityStreamUpdate[1].activities[0].subjectIds[0]).toEqual(
        participant.id
      );
      expect(activityStreamUpdate[1].activities[0].challengeId).toEqual(
        challenge.id
      );
      expect(activityStreamUpdate[1].activities[0].objectType).toEqual(
        ActivityObjectType.CHALLENGE
      );
      expect(activityStreamUpdate[1].activities[0].verb).toEqual(
        ActivityVerb.JOINED_CHALLENGE
      );
      expect(activityStreamUpdate[1].activities[0].verb).toEqual(
        ActivityVerb.JOINED_CHALLENGE
      );
    });

    it(`should update the challenge's joinedAD`, async () => {
      const participant = UserEntityFake();
      const author = UserEntityFake({
        activityStream: ActivityStreamEntityFake(),
      });
      const challenge = ChallengeEntityFake({ authorId: author.id });
      service['userService'].findById = jest
        .fn()
        .mockResolvedValue(participant);
      const userRepo = { findOne: jest.fn().mockResolvedValue(author) };
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValue(challenge),
        update: jest.fn(),
      };
      const activityStreamRepo = { update: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) return userRepo;
          if (entity === ActivityStreamEntity) return activityStreamRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.participantJoinedChallenge({
        participantId: participant.id,
        challengeId: challenge.id,
      });
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      const challengeADUpdate = challengeRepo.update.mock.calls[0];
      expect(challengeADUpdate[0]).toEqual(challenge.id);
      expect(challengeADUpdate[1].activityData.joinedAD.ids).toEqual([
        activityStreamUpdate[1].activities[0].id,
      ]);
      expect(challengeADUpdate[1].activityData.joinedAD.isAggregated).toBe(
        false
      );
    });

    it(`should aggregate the challenge's joinedAD`, async () => {
      const participant = UserEntityFake();
      const author = UserEntityFake({
        activityStream: ActivityStreamEntityFake(),
      });
      const challenge = ChallengeEntityFake({ authorId: author.id });
      challenge.activityData = {
        type: 'ActivityData',
        joinedAD: {
          type: 'ActivityItemData',
          ids: ['1', '2', '3', '4', '5'],
          isAggregated: false,
        },
      };
      service['userService'].findById = jest
        .fn()
        .mockResolvedValue(participant);
      const userRepo = { findOne: jest.fn().mockResolvedValue(author) };
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValue(challenge),
        update: jest.fn(),
      };
      const activityStreamRepo = { update: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) return userRepo;
          if (entity === ActivityStreamEntity) return activityStreamRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.participantJoinedChallenge({
        participantId: participant.id,
        challengeId: challenge.id,
      });
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      const challengeADUpdate = challengeRepo.update.mock.calls[0];
      expect(challengeADUpdate[0]).toEqual(challenge.id);
      expect(challengeADUpdate[1].activityData.joinedAD.ids).toEqual([
        activityStreamUpdate[1].activities[0].id,
        '5',
      ]);
      expect(challengeADUpdate[1].activityData.joinedAD.isAggregated).toBe(
        true
      );
    });

    it('should send a notification to the challenge author', async () => {
      const participant = UserEntityFake();
      const author = UserEntityFake({
        fcmToken: 'fcmToken',
        activityStream: ActivityStreamEntityFake(),
      });
      const challenge = ChallengeEntityFake({ authorId: author.id });
      challenge.activityData = {
        type: 'ActivityData',
        joinedAD: {
          type: 'ActivityItemData',
          ids: [],
          isAggregated: false,
        },
      };
      service['userService'].findById = jest
        .fn()
        .mockResolvedValue(participant);
      const userRepo = { findOne: jest.fn().mockResolvedValue(author) };
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValue(challenge),
        update: jest.fn(),
      };
      const activityStreamRepo = { update: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) return userRepo;
          if (entity === ActivityStreamEntity) return activityStreamRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.participantJoinedChallenge({
        participantId: participant.id,
        challengeId: challenge.id,
      });
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        author.fcmToken,
        `${participant.handle} joined your challenge `,
        {
          body: `${participant.handle} joined your challenge `,
          challengeId: challenge.id,
          objectId: challenge.id,
          objectType: `${ActivityObjectType.CHALLENGE}`,
          subjectId: participant.id,
          verb: 'JOINED_CHALLENGE',
        }
      );
    });

    it('should send a aggregated notifications to the challenge author', async () => {
      const participant = UserEntityFake();
      const firstParticipant = UserEntityFake();
      const activityStream = ActivityStreamEntityFake();
      activityStream.activities = [
        ActivityFake({
          subjectIds: ['1', '2', '3', '4', firstParticipant.id],
        }),
      ];
      const author = UserEntityFake({
        fcmToken: 'fcmToken',
        activityStream: ActivityStreamEntityFake(),
      });
      const challenge = ChallengeEntityFake({ authorId: author.id });
      challenge.activityData = {
        type: 'ActivityData',
        joinedAD: {
          type: 'ActivityItemData',
          ids: ['1', '2', '3', '4', firstParticipant.id],
          isAggregated: false,
        },
      };
      service['userService'].findById = jest.fn().mockImplementation(id => {
        if (id === participant.id) return participant;
        if (id === firstParticipant.id) return firstParticipant;
      });
      const userRepo = { findOne: jest.fn().mockResolvedValue(author) };
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValue(challenge),
        update: jest.fn(),
      };
      const activityStreamRepo = { update: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) return userRepo;
          if (entity === ActivityStreamEntity) return activityStreamRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['userService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        },
      };
      await service.participantJoinedChallenge({
        participantId: participant.id,
        challengeId: challenge.id,
      });
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        author.fcmToken,
        `${participant.handle}, ${firstParticipant.handle}, and 4 others joined your challenge `,
        {
          body: `${participant.handle}, ${firstParticipant.handle}, and 4 others joined your challenge `,
          challengeId: challenge.id,
          objectId: challenge.id,
          objectType: `${ActivityObjectType.CHALLENGE}`,
          subjectId: participant.id,
          verb: 'JOINED_CHALLENGE',
        }
      );
    });
  });

  describe('followeeCreatedChallenge', () => {
    it('should return if the challenge is not found', async () => {
      const challengeId = 'challenge-id';
      const followerId = 'follower-id';
      service['challengeService'].findById = jest.fn().mockResolvedValue(null);
      await service.followeeCreatedChallenge({ challengeId, followerId });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: challengeId,
        findOptions: { relations: ['author'] },
      });
    });

    it('should return if the challenge author is not found', async () => {
      const challengeId = 'challenge-id';
      const followerId = 'follower-id';
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        author: null,
      });
      await service.followeeCreatedChallenge({ challengeId, followerId });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: challengeId,
        findOptions: { relations: ['author'] },
      });
    });

    it('should return if the follower is not found', async () => {
      const followerId = 'follower-id';
      const challenge = ChallengeEntityFake();
      const author = UserEntityFake();
      challenge.author = author;
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        author: author,
      });
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => userRepo),
      };
      // @ts-ignore
      service['userService'].repo = {
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        } as any,
      };
      await service.followeeCreatedChallenge({
        challengeId: challenge.id,
        followerId,
      });
      expect(userRepo.findOne).toHaveBeenCalledWith(followerId, {
        relations: ['activityStream'],
      });
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('should return if the followers activity stream is not found', async () => {
      const follower = UserEntityFake();
      follower.activityStream = undefined;
      const challenge = ChallengeEntityFake();
      const author = UserEntityFake();
      challenge.author = author;
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        author: author,
      });
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(follower),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => userRepo),
      };
      // @ts-ignore
      service['userService'].repo = {
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        } as any,
      };
      await service.followeeCreatedChallenge({
        challengeId: challenge.id,
        followerId: follower.id,
      });
      expect(userRepo.findOne).toHaveBeenCalledWith(follower.id, {
        relations: ['activityStream'],
      });
      expect(activityStreamRepo.update).not.toHaveBeenCalled();
    });

    it('should update followers activity stream', async () => {
      const activityStream = ActivityStreamEntityFake();
      const follower = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
      });
      const challenge = ChallengeEntityFake();
      const author = UserEntityFake();
      challenge.author = author;
      service['challengeService'].findById = jest
        .fn()
        .mockResolvedValue(challenge);
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(follower),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['userService'].repo = {
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        } as any,
      };
      await service.followeeCreatedChallenge({
        challengeId: challenge.id,
        followerId: follower.id,
      });
      expect(activityStreamRepo.update).toHaveBeenCalledTimes(1);
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      expect(activityStreamUpdate[0]).toEqual(activityStream.id);
      expect(activityStreamUpdate[1].activities).toHaveLength(1);
      expect(activityStreamUpdate[1].activities[0].challengeId).toEqual(
        challenge.id
      );
      expect(activityStreamUpdate[1].activities[0].objectId).toEqual(
        challenge.id
      );
      expect(activityStreamUpdate[1].activities[0].subjectIds[0]).toEqual(
        author.id
      );
      expect(activityStreamUpdate[1].activities[0].verb).toEqual(
        ActivityVerb.CHALLENGE_CREATED
      );
    });

    it('should send correct firebase fcm notification', async () => {
      const activityStream = ActivityStreamEntityFake();
      const follower = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
        fcmToken: 'fcm-token',
      });
      const challenge = ChallengeEntityFake();
      challenge.author = UserEntityFake();
      service['challengeService'].findById = jest
        .fn()
        .mockResolvedValue(challenge);
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(follower),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['userService'].repo = {
        manager: {
          transaction: jest.fn().mockImplementation(async tx => {
            return await tx(manager);
          }),
        } as any,
      };
      await service.followeeCreatedChallenge({
        challengeId: challenge.id,
        followerId: follower.id,
      });
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        follower.fcmToken,
        `${challenge.author.handle} just created a challenge 🎯 \n Tap to check it out!`,
        {
          body: `${challenge.author.handle} just created a challenge 🎯 \n Tap to check it out!`,
          challengeId: challenge.id,
          subjectId: challenge.author.id,
          objectId: challenge.id,
          objectType: `${ActivityObjectType.CHALLENGE}`,
          verb: 'CHALLENGE_CREATED',
        }
      );
    });
  });

  describe.skip('ringImprovedEvent', () => {
    it('should upsert a ring improvement event to the users activity stream', async () => {
      const activityStream = ActivityStreamEntityFake();
      const user = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
        fcmToken: 'fcm-token',
      });
      service['activityStreamService'].findById = jest
        .fn()
        .mockImplementation(async id => {
          return [activityStream].find(a => a.id === id);
        });
      const userRepo = {
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['postService'].repo = {
        repository: {
          manager: {
            transaction: jest.fn().mockImplementation(async tx => {
              return await tx(manager);
            }),
          } as any,
        },
      } as PostRepository;
      await service.ringImprovedEvent(user, 'green', 'good');
      expect(activityStreamRepo.update).toHaveBeenCalledTimes(1);
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      expect(activityStreamUpdate[0]).toEqual(activityStream.id);
      expect(activityStreamUpdate[1].activities[0]).toEqual({
        id: expect.any(String),
        challengeId: undefined,
        commentId: undefined,
        createdAt: expect.any(Date),
        metaEvent: 0,
        miscId: undefined,
        objectId: user.id,
        objectType: ActivityObjectType.USER,
        postId: undefined,
        postPageIndex: undefined,
        reportId: undefined,
        subjectIds: ['wildr'],
        type: ActivityType.SINGLE,
        updatedAt: expect.any(Date),
        verb: ActivityVerb.IMPROVED_PROFILE_RING,
        contentBody: 'green',
        replyId: undefined,
      });
    });

    it('should send an fcm notification to the user', async () => {
      const activityStream = ActivityStreamEntityFake();
      const user = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
        fcmToken: 'fcm-token',
      });
      service['activityStreamService'].findById = jest
        .fn()
        .mockImplementation(async id => {
          return [activityStream].find(a => a.id === id);
        });
      const userRepo = {
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['postService'].repo = {
        repository: {
          manager: {
            transaction: jest.fn().mockImplementation(async tx => {
              return await tx(manager);
            }),
          } as any,
        },
      } as PostRepository;
      await service.ringImprovedEvent(user, 'green', 'good');
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        user.fcmToken,
        `Congrats! 🎉 `,
        {
          body: `Congrats! 🎉 `,
          type: 'SYSTEM',
          verb: 'IMPROVED_PROFILE_RING',
          ringColor: 'green',
          score: undefined,
        }
      );
    });
  });

  describe('strikeEvent', () => {
    it('should upsert a strike event to the users activity stream', async () => {
      const activityStream = ActivityStreamEntityFake();
      const user = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
        fcmToken: 'fcm-token',
      });
      service['activityStreamService'].findById = jest
        .fn()
        .mockImplementation(async id => {
          return [activityStream].find(a => a.id === id);
        });
      const userRepo = {
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['postService'].repo = {
        repository: {
          manager: {
            transaction: jest.fn().mockImplementation(async tx => {
              return await tx(manager);
            }),
          } as any,
        },
      } as PostRepository;
      await service.strikeEvent(user, 1, 'reviewRequestId');
      expect(activityStreamRepo.update).toHaveBeenCalledTimes(1);
      const activityStreamUpdate = activityStreamRepo.update.mock.calls[0];
      expect(activityStreamUpdate[0]).toEqual(activityStream.id);
      expect(activityStreamUpdate[1].activities[0]).toEqual({
        id: expect.any(String),
        challengeId: undefined,
        commentId: undefined,
        contentBody: undefined,
        createdAt: expect.any(Date),
        metaEvent: 0,
        miscId: 'reviewRequestId',
        objectId: user.id,
        objectType: ActivityObjectType.USER,
        postId: undefined,
        postPageIndex: undefined,
        reportId: 'reviewRequestId',
        subjectIds: ['wildr'],
        type: ActivityType.SINGLE,
        updatedAt: expect.any(Date),
        verb: ActivityVerb.REC_FIRST_STRIKE,
      });
    });

    it('should send an fcm notification to the user', async () => {
      const activityStream = ActivityStreamEntityFake();
      const user = UserEntityFake({
        activityStreamId: activityStream.id,
        activityStream,
        fcmToken: 'fcm-token',
      });
      service['activityStreamService'].findById = jest
        .fn()
        .mockImplementation(async id => {
          return [activityStream].find(a => a.id === id);
        });
      const userRepo = {
        update: jest.fn(),
      };
      const activityStreamRepo = {
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === UserEntity) {
            return userRepo;
          } else if (entity === ActivityStreamEntity) {
            return activityStreamRepo;
          }
        }),
      };
      // @ts-ignore
      service['postService'].repo = {
        repository: {
          manager: {
            transaction: jest.fn().mockImplementation(async tx => {
              return await tx(manager);
            }),
          } as any,
        },
      } as PostRepository;
      await service.strikeEvent(user, 1, 'reviewRequestId');
      expect(service['fcmService'].sendNotification).toHaveBeenCalledWith(
        user.fcmToken,
        `You've received your first strike.`,
        {
          body: `You've received your first strike.`,
          type: 'SYSTEM',
          verb: 'REC_FIRST_STRIKE',
          reviewRequestId: 'reviewRequestId',
        }
      );
    });
  });
});
