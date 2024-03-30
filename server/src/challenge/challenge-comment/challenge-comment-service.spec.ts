import { getRepositoryToken } from '@nestjs/typeorm';
import { defaultChallengeAccessControl } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeInteractionEnum } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { CommentRepository } from '@verdzie/server/comment/comment.repository';
import {
  CommentParentType,
  CommentService,
} from '@verdzie/server/comment/comment.service';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { newAppContext } from '@verdzie/server/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@verdzie/server/exceptions/wildr.exception';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserService } from '@verdzie/server/user/user.service';

describe('ChallengeCommentService', () => {
  describe('pinComment', () => {
    it('should return not found exception if challenge does not exist', async () => {
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(undefined) },
            },
            {
              provide: ChallengeRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(undefined) },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const currentUser = UserEntityFake();
      const result = await service.pinComment({
        challengeId: 'challengeId',
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error.message).toBe('Challenge not found');
      }
    });

    it('should return not found exception if comment does not exist', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(undefined) },
            },
            {
              provide: ChallengeRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(challenge) },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.pinComment({
        challengeId: 'challengeId',
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error.message).toBe('Comment not found');
      }
    });

    it('should return bad request exception if the comment is not related to the challenge', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const comment = CommentEntityFake({
        challengeId: 'otherChallengeId',
      });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: {
                findOne: jest.fn().mockResolvedValueOnce(comment),
              },
            },
            {
              provide: ChallengeRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(challenge) },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.pinComment({
        challengeId: 'challengeId',
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should return an error if unknown exception is thrown', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: {
                findOne: jest
                  .fn()
                  .mockRejectedValueOnce(new Error('Unknown error')),
              },
            },
            {
              provide: ChallengeRepository,
              useValue: { findOne: jest.fn().mockResolvedValueOnce(challenge) },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.pinComment({
        challengeId: 'challengeId',
        commentId: 'commentId',
        currentUser,
        context: newAppContext(),
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should update the challenge with the new pinned comment', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const comment = CommentEntityFake({
        challengeId: challenge.id,
      });
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValueOnce(challenge),
        update: jest.fn(),
      };
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            ChallengeRepository,
            {
              provide: CommentRepository,
              useValue: {
                findOne: jest.fn().mockResolvedValueOnce(comment),
              },
            },
            {
              provide: getRepositoryToken(ChallengeEntity),
              useValue: challengeRepo,
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.pinComment({
        challengeId: challenge.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(result.isOk()).toBeTruthy();
      expect(challengeRepo.update).toHaveBeenCalledWith(
        { id: challenge.id },
        { pinnedCommentId: comment.id }
      );
    });

    it('should return the challenge with the comment', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const comment = CommentEntityFake({
        challengeId: challenge.id,
      });
      const challengeRepo = {
        findOne: jest.fn().mockResolvedValueOnce(challenge),
        update: jest.fn(),
      };
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            ChallengeService,
            CommentService,
            ChallengeRepository,
            {
              provide: CommentRepository,
              useValue: {
                findOne: jest.fn().mockResolvedValueOnce(comment),
              },
            },
            {
              provide: getRepositoryToken(ChallengeEntity),
              useValue: challengeRepo,
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.pinComment({
        challengeId: challenge.id,
        commentId: comment.id,
        currentUser,
        context: newAppContext(),
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value.challenge).toBeInstanceOf(ChallengeEntity);
        expect(result.value.pinnedComment).toBe(comment);
        expect(result.value.pinnedComment.id).toBe(comment.id);
      }
    });

    it('should update the authors interaction count', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
      });
      const comment = CommentEntityFake({
        challengeId: challenge.id,
      });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            {
              provide: ChallengeService,
              useValue: {
                findById: jest.fn().mockResolvedValueOnce(challenge),
              },
            },
            {
              provide: CommentService,
              useValue: {
                findById: jest.fn().mockResolvedValueOnce(comment),
              },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const context = newAppContext();
      const result = await service.pinComment({
        challengeId: challenge.id,
        commentId: comment.id,
        currentUser,
        context,
      });
      expect(result.isOk()).toBeTruthy();
      expect(
        service['challengeInteractionService']
          .updateChallengeInteractionsIfAuthor
      ).toHaveBeenCalledWith({
        postOrChallenge: challenge,
        currentUser,
        objectId: comment.id,
        interactionType: ChallengeInteractionEnum.PINNED_COMMENT,
        context,
      });
    });
  });

  describe('unPinComment', () => {
    it('should return a not found error if the challenge does not exist', async () => {
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [ChallengeCommentService],
        })
      ).get(ChallengeCommentService);
      service['challengeService'].findById = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      const result = await service.unPinComment({
        challengeId: 'challengeId',
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should return an unauthorized error if the challenge is not owned by the current user', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: 'somebodyElse',
        pinnedCommentId: 'commentId',
      });
      const service = (
        await createMockedTestingModule({
          providers: [ChallengeCommentService],
        })
      ).get(ChallengeCommentService);
      service['challengeService'].findById = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      const result = await service.unPinComment({
        challengeId: challenge.id,
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('should return challenge and remove pinned comment', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
        pinnedCommentId: 'commentId',
      });
      const service = (
        await createMockedTestingModule({
          providers: [ChallengeCommentService],
        })
      ).get(ChallengeCommentService);
      service['challengeService'].findById = jest
        .fn()
        .mockResolvedValueOnce(challenge);
      const result = await service.unPinComment({
        challengeId: challenge.id,
        currentUser,
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(ChallengeEntity);
      }
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: challenge.id,
      });
      expect(service['repo'].update).toHaveBeenCalledWith({
        criteria: { id: challenge.id },
        partialEntity: { pinnedCommentId: undefined },
      });
    });

    it('should handle unexpected errors', async () => {
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [ChallengeCommentService],
        })
      ).get(ChallengeCommentService);
      service['challengeService'].findById = jest
        .fn()
        .mockRejectedValueOnce(new Error('unexpected'));
      const result = await service.unPinComment({
        challengeId: 'challengeId',
        currentUser,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('getCommentFromAppContext', () => {
    it('should get the comment from the app context if possible', async () => {
      const service = (
        await createMockedTestingModule({
          providers: [ChallengeCommentService, CommentService],
        })
      ).get(ChallengeCommentService);
      const comment = CommentEntityFake();
      const context = {
        comments: {
          [comment.id]: comment,
        },
      } as any;
      const result = await service.getCommentFromAppContext({
        commentId: comment.id,
        context,
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value).toBe(comment);
      }
    });

    it('should find the comment if necessary', async () => {
      const comment = CommentEntityFake();
      const commentRepo = {
        findOne: jest.fn().mockResolvedValueOnce(comment),
      };
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: commentRepo,
            },
          ],
        })
      ).get(ChallengeCommentService);
      const context = {
        comments: {},
      } as any;
      const result = await service.getCommentFromAppContext({
        commentId: comment.id,
        context,
      });
      expect(result.isOk()).toBeTruthy();
      if (result.isOk()) {
        expect(result.value).toBe(comment);
      }
      expect(commentRepo.findOne).toHaveBeenCalledWith(comment.id, undefined);
    });

    it('should return a not found exception if comment is not found', async () => {
      const comment = CommentEntityFake();
      const commentRepo = {
        findOne: jest.fn(),
      };
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: commentRepo,
            },
          ],
        })
      ).get(ChallengeCommentService);
      const context = {
        comments: {},
      } as any;
      const result = await service.getCommentFromAppContext({
        commentId: comment.id,
        context,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should return internal server error if unknown error occurs', async () => {
      const comment = CommentEntityFake();
      const commentRepo = {
        findOne: jest.fn().mockRejectedValue(new Error()),
      };
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            CommentService,
            {
              provide: CommentRepository,
              useValue: commentRepo,
            },
          ],
        })
      ).get(ChallengeCommentService);
      const context = {
        comments: {},
      } as any;
      const result = await service.getCommentFromAppContext({
        commentId: comment.id,
        context,
      });
      expect(result.isErr()).toBeTruthy();
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('canCommentStatusAndMessage', () => {
    it('should return the cannot comment error message if one is created', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      const author = UserEntityFake({ id: challenge.authorId });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            {
              provide: UserService,
              useValue: {
                findById: jest.fn().mockImplementation(async authorId => {
                  expect(authorId).toEqual(challenge.authorId);
                  return author;
                }),
              },
            },
            {
              provide: CommentService,
              useValue: {
                cannotCommentErrorMessage: jest.fn(),
              },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.canCommentStatusAndMessage({
        challenge,
        userId: currentUser.id,
      });
      expect(result.isOk()).toEqual(true);
      if (result.isOk()) {
        expect(result.value.canPostComment).toBe(true);
        expect(result.value.errorMessage).toEqual(undefined);
      }
      expect(
        service['commentService'].cannotCommentErrorMessage
      ).toBeCalledWith({
        userId: currentUser.id,
        parentId: challenge.id,
        parentAuthor: author,
        parentAuthorId: challenge.authorId,
        parentType: CommentParentType.CHALLENGE,
        checkForHasBlocked: true,
        commentPostingAccessData:
          challenge.accessControl?.commentPostingAccessData,
      });
    });

    it('should use default access control if challenge does not have any', async () => {
      const challenge = ChallengeEntityFake();
      challenge.accessControl = undefined;
      const currentUser = UserEntityFake();
      const author = UserEntityFake({ id: challenge.authorId });
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            {
              provide: UserService,
              useValue: {
                findById: jest.fn().mockImplementation(async authorId => {
                  expect(authorId).toEqual(challenge.authorId);
                  return author;
                }),
              },
            },
            {
              provide: CommentService,
              useValue: {
                cannotCommentErrorMessage: jest.fn(),
              },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.canCommentStatusAndMessage({
        challenge,
        userId: currentUser.id,
      });
      expect(result.isOk()).toEqual(true);
      if (result.isOk()) {
        expect(result.value.canPostComment).toEqual(true);
        expect(result.value.errorMessage).toEqual(undefined);
      }
      expect(
        service['commentService'].cannotCommentErrorMessage
      ).toBeCalledWith({
        userId: currentUser.id,
        parentId: challenge.id,
        parentAuthor: author,
        parentAuthorId: challenge.authorId,
        parentType: CommentParentType.CHALLENGE,
        checkForHasBlocked: true,
        commentPostingAccessData:
          defaultChallengeAccessControl().commentPostingAccessData,
      });
    });

    it('should return a not found error if the author is not found', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            {
              provide: UserService,
              useValue: {
                findById: jest.fn().mockResolvedValue(undefined),
              },
            },
            {
              provide: CommentService,
              useValue: {
                cannotCommentErrorMessage: jest.fn(),
              },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.canCommentStatusAndMessage({
        challenge,
        userId: currentUser.id,
      });
      expect(result.isErr()).toEqual(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should handle unexpected errors', async () => {
      const challenge = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      const service = (
        await createMockedTestingModule({
          providers: [
            ChallengeCommentService,
            {
              provide: UserService,
              useValue: {
                findById: jest.fn().mockRejectedValue(new Error('test')),
              },
            },
            {
              provide: CommentService,
              useValue: {
                cannotCommentErrorMessage: jest.fn(),
              },
            },
          ],
        })
      ).get(ChallengeCommentService);
      const result = await service.canCommentStatusAndMessage({
        challenge,
        userId: currentUser.id,
      });
      expect(result.isErr()).toEqual(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });
});
