import { Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { AppContext } from '@verdzie/server/common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Connection } from 'typeorm';
import { Logger } from 'winston';

export class ContextService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async getChallengeEntityFromContext({
    id,
    context,
    shouldAddAuthor = false,
  }: {
    id: string;
    context: AppContext;
    shouldAddAuthor?: boolean;
  }): Promise<ChallengeEntity | undefined> {
    if (context.challenges[id]) {
      return context.challenges[id];
    }
    const challenge = await this.connection
      .getRepository(ChallengeEntity)
      .findOne({
        where: { id },
        relations: shouldAddAuthor ? [ChallengeEntity.kAuthorRelation] : [],
      });
    if (!challenge) return;
    context.challenges[id] = challenge;
    if (shouldAddAuthor && challenge.author) {
      context.users[challenge.authorId] = challenge.author;
    }
    return challenge;
  }

  async getPostEntityFromContext({
    id,
    context,
    shouldAddAuthor = false,
  }: {
    id: string;
    context: AppContext;
    shouldAddAuthor?: boolean;
  }): Promise<PostEntity | undefined> {
    if (context.posts[id]) {
      return context.posts[id];
    }
    // this.logger.debug(
    //   `[getPostEntityFromContext] fetching post ${id} from database`
    // );
    const post = await this.connection.getRepository(PostEntity).findOne({
      where: { id },
      relations: shouldAddAuthor ? [PostEntity.kAuthorRelation] : [],
    });
    if (!post) {
      return;
    }
    context.posts[id] = post;
    if (shouldAddAuthor && post.author) {
      context.users[post.authorId] = post.author;
    }
    return post;
  }
}
