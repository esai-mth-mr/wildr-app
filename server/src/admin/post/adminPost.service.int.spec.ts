import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminPostService } from '@verdzie/server/admin/post/adminPost.service';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { PostService } from '@verdzie/server/post/post.service';

describe('AdminPostService', () => {
  let service: AdminPostService;
  let conn: Connection;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    await conn.synchronize(true);
    postRepo = conn.getRepository(PostEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        AdminPostService,
        {
          provide: PostService,
          useValue: {
            parseAllUrls: jest.fn().mockImplementation(posts => posts),
          },
        },
        {
          provide: getRepositoryToken(PostEntity),
          useValue: postRepo,
        },
      ],
    });
    service = module.get<AdminPostService>(AdminPostService);
  });

  afterEach(async () => {
    await postRepo.delete({});
    await userRepo.delete({});
  });

  afterAll(async () => {
    await conn.close();
  });

  describe('getUnannotatedPosts', () => {
    it('should return posts without categories', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 10 }, () =>
        PostEntityFake({
          authorId: user.id,
        })
      );
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        10,
        0
      );
      expect(result).toHaveLength(10);
    });

    it('should not return deleted posts', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 3 }, () => {
        const post = PostEntityFake();
        post.authorId = user.id;
        post.willBeDeleted = true;
        return post;
      });
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        10,
        0
      );
      expect(result).toHaveLength(0);
    });

    it('should not return TAKEN_DOWN', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 3 }, () => {
        const post = PostEntityFake();
        post.authorId = user.id;
        post.state = ExistenceState.TAKEN_DOWN;
        return post;
      });
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        10,
        0
      );
      expect(result).toHaveLength(0);
    });

    it('should not return posts that are SUSPENDED', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 3 }, () => {
        const post = PostEntityFake();
        post.authorId = user.id;
        post.state = ExistenceState.SUSPENDED;
        return post;
      });
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        10,
        0
      );
      expect(result).toHaveLength(0);
    });

    it('should return posts that are ALIVE', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 3 }, () => {
        const post = PostEntityFake();
        post.authorId = user.id;
        post.state = ExistenceState.ALIVE;
        return post;
      });
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        10,
        0
      );
      expect(result).toHaveLength(3);
    });

    it('should return posts in descending order by created date', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 10 }, () =>
        PostEntityFake({ authorId: user.id })
      );
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        5,
        5
      );
      expect(result).toHaveLength(5);
      const expectedIds = posts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(5)
        .map(p => p.id);
      expect(result?.map(p => p.id)).toEqual(expectedIds);
    });

    it('should return valid post objects', async () => {
      const user = UserEntityFake();
      const posts = Array.from({ length: 2 }, () =>
        PostEntityFake({ authorId: user.id })
      );
      await userRepo.insert(user);
      await postRepo.insert(posts);
      const result = await service.getUnannotatedPosts(
        new Date().toISOString(),
        2,
        0
      );
      const expectedPost = posts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];
      expect(result?.[0]).toMatchObject(expectedPost);
    });
  });
});
