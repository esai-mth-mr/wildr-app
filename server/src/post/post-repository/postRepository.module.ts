import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostSchema } from '@verdzie/server/post/post.schema';
import { PostRepository } from '@verdzie/server/post/post-repository/post.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PostSchema])],
  providers: [PostRepository],
  exports: [PostRepository],
})
export class PostRepositoryModule {}
