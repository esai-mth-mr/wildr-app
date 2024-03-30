import { CommentRepository } from './comment.repository';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CommentRepository', () => {
  let repo: CommentRepository;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        CommentRepository,
        {
          provide: getRepositoryToken(CommentEntity),
          useValue: {},
        },
      ],
    });
    repo = module.get(CommentRepository);
  });

  describe('findByIdWithPost', () => {
    it('should return undefined if comment is not found', async () => {
      // @ts-expect-error
      repo.repo = {
        findOne: jest.fn().mockResolvedValue(undefined),
      };
      const result = await repo.findByIdWithPost('commentId');
      expect(result).toBe(undefined);
    });

    it('should return comment with post', async () => {
      const comment = CommentEntityFake();
      repo.findOne = jest.fn().mockResolvedValue(comment);
      const result = await repo.findByIdWithPost('commentId');
      expect(result).toEqual(comment);
      expect(repo.findOne).toHaveBeenCalledWith(
        'commentId',
        {
          relations: ['post'],
        },
        undefined
      );
    });

    it('should pass txOptions', async () => {
      const comment = CommentEntityFake();
      repo.findOne = jest.fn().mockResolvedValue(comment);
      const txRepo = {};
      const result = await repo.findByIdWithPost('commentId', {
        // @ts-expect-error
        repo: txRepo,
      });
      expect(result).toEqual(comment);
      expect(repo.findOne).toHaveBeenCalledWith(
        'commentId',
        {
          relations: ['post'],
        },
        { repo: txRepo }
      );
    });
  });

  describe('findByIds', () => {
    it('should search using available find condition', async () => {
      const comments = Array.from({ length: 3 }, () => CommentEntityFake());
      const commentIds = comments.map(comment => comment.id);
      repo['repo'].findByIds = jest.fn().mockResolvedValue(comments);
      await repo.findByIds(commentIds);
      expect(repo['repo'].findByIds).toHaveBeenCalledWith(commentIds, {
        where: {
          ...repo['isAvailableFindCondition'].where,
        },
      });
    });

    it('should use where clause from options', async () => {
      const comments = Array.from({ length: 3 }, () => CommentEntityFake());
      const commentIds = comments.map(comment => comment.id);
      repo['repo'].findByIds = jest.fn().mockResolvedValue(comments);
      await repo.findByIds(commentIds, { where: { hidden: false } });
      expect(repo['repo'].findByIds).toHaveBeenCalledWith(commentIds, {
        where: {
          ...repo['isAvailableFindCondition'].where,
          hidden: false,
        },
      });
    });

    it('should use where clause from options', async () => {
      const comments = Array.from({ length: 3 }, () => CommentEntityFake());
      const commentIds = comments.map(comment => comment.id);
      repo['repo'].findByIds = jest.fn().mockResolvedValue(comments);
      await repo.findByIds(commentIds, {
        where: { hidden: false },
        relations: ['post'],
      });
      expect(repo['repo'].findByIds).toHaveBeenCalledWith(commentIds, {
        where: {
          ...repo['isAvailableFindCondition'].where,
          hidden: false,
        },
        relations: ['post'],
      });
    });
  });

  describe('findOne', () => {
    it('should search using available find condition', async () => {
      const comment = CommentEntityFake();
      repo['repo'].findOne = jest.fn().mockResolvedValue(comment);
      await repo.findOne(comment.id);
      expect(repo['repo'].findOne).toHaveBeenCalledWith(comment.id, {
        where: {
          ...repo['isAvailableFindCondition'].where,
        },
      });
    });

    it('should use where clause from options', async () => {
      const comment = CommentEntityFake();
      repo['repo'].findOne = jest.fn().mockResolvedValue(comment);
      await repo.findOne(comment.id, { where: { hidden: false } });
      expect(repo['repo'].findOne).toHaveBeenCalledWith(comment.id, {
        where: {
          ...repo['isAvailableFindCondition'].where,
          hidden: false,
        },
      });
    });

    it('should use relations options', async () => {
      const comment = CommentEntityFake();
      repo['repo'].findOne = jest.fn().mockResolvedValue(comment);
      await repo.findOne(comment.id, {
        where: { hidden: false },
        relations: ['post'],
      });
      expect(repo['repo'].findOne).toHaveBeenCalledWith(comment.id, {
        where: {
          ...repo['isAvailableFindCondition'].where,
          hidden: false,
        },
        relations: ['post'],
      });
    });
  });
});
