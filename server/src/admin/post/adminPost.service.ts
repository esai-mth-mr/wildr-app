import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Not, Repository, UpdateResult } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import { SensitiveStatus } from '@verdzie/server/admin/post/adminPost.controller';
import { OpenSearchIndexService } from '@verdzie/server/open-search/open-search-index/openSearchIndex.service';
import { PostCategoryService } from '@verdzie/server/post-category/postCategory.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { Result, err, ok } from 'neverthrow';
import { OSQueryService } from '@verdzie/server/open-search-v2/query/query.service';
import { preserveOrderByIds } from '@verdzie/server/data/common';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';

@Injectable()
export class AdminPostService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(PostEntity)
    private repo: Repository<PostEntity>,
    private postService: PostService,
    private readonly openSearchIndexService: OpenSearchIndexService,
    private readonly postCategoryService: PostCategoryService,
    private readonly osQueryService: OSQueryService
  ) {
    this.logger = this.logger.child({ context: 'AdminPostService' });
  }

  async getPosts(
    date: string,
    limit: number,
    parseUrls: boolean
  ): Promise<PostEntity[] | undefined> {
    const posts: PostEntity[] = await this.repo.find({
      where: { createdAt: LessThan(date) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return parseUrls ? await this.postService.parseAllUrls(posts) : posts;
  }

  async getUnannotatedPosts(
    date: string,
    take: number,
    skip: number
  ): Promise<PostEntity[] | undefined> {
    const rawPosts = await this.repo.query(
      `SELECT * FROM ${PostEntity.kTableName} ` +
        `WHERE ${PostEntity.kFields.willBeDeleted} IS NULL ` +
        `AND ${PostEntity.kFields.categoryIds} IS NULL ` +
        `AND ${PostEntity.kFields.createdAt} < $1 ` +
        `AND(${PostEntity.kFields.state} = $2 OR ${PostEntity.kFields.state} IS NULL) ` +
        `ORDER BY ${PostEntity.kFields.createdAt} DESC ` +
        `LIMIT $3 ` +
        `OFFSET $4`,
      [date, ExistenceState.ALIVE, take, skip]
    );
    const posts = rawPosts.map((rawPost: any) => PostEntity.fromRaw(rawPost));
    return await this.postService.parseAllUrls(posts);
  }

  async addCategories(
    id: string,
    categories: string[]
  ): Promise<string | undefined> {
    const post = await this.postService.findById(id);
    if (!post) return 'Post not found';
    if (post.categoryIds) return 'Already annotated';
    const shouldDistributeRightAway =
      (process.env.DIST_ANTD_POSTS_ASAP ?? 'false') === 'true';
    this.logger.info('shouldDistributeRightAway', {
      shouldDistributeRightAway,
    });
    await this.postService.addCategories(
      categories,
      post,
      shouldDistributeRightAway
    );
    const categoryEntities =
      await this.postCategoryService.getCategoriesFromIds(categories);

    await this.openSearchIndexService.addCategoriesToPost(
      categoryEntities.map(e => e.name),
      id
    );
  }

  async updatePost(id: string, data: any): Promise<UpdateResult> {
    return await this.repo.update(id, data);
  }

  async takeDown(id: string): Promise<boolean> {
    return await this.postService.takeDown(id);
  }

  async respawn(id: string): Promise<boolean> {
    return await this.postService.respawn(id);
  }

  async addSensitiveStatus(
    id: string,
    status?: SensitiveStatus
  ): Promise<boolean> {
    return await this.postService.changeSensitiveStatus(
      id,
      this.postService.toSensitiveStatus(status)
    );
  }

  async searchPosts({ queryString }: { queryString: string }): Promise<
    Result<
      {
        post: PostEntity;
        author: UserEntity;
      }[],
      InternalServerErrorException
    >
  > {
    try {
      const postIds = await this.osQueryService.searchPostsAndReturnIds({
        queryString,
        paginationInput: {
          take: 50,
        },
      });
      const posts = await this.repo.findByIds(postIds, {
        relations: [PostEntity.kAuthorRelation],
      });
      const orderedPosts = preserveOrderByIds(postIds, posts);
      const postAuthorPairs: { post: PostEntity; author: UserEntity }[] = [];
      for (const [index, post] of orderedPosts.entries()) {
        if (!post) {
          this.logger.error(`[searchPosts] couldn't find post`, {
            postId: postIds[index],
          });
          continue;
        }
        if (!post.author) {
          this.logger.error(`[searchPosts] couldn't find author for post`, {
            postId: post.id,
          });
          continue;
        }
        postAuthorPairs.push({
          post: post,
          author: post.author,
        });
      }
      return ok(postAuthorPairs);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[searchPosts] ' + error,
          { queryString },
          error
        )
      );
    }
  }
}
