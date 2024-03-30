import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentRepository } from '@verdzie/server/comment/comment.repository';
import { CommentSchema } from '@verdzie/server/comment/comment.schema';

@Module({
  imports: [TypeOrmModule.forFeature([CommentSchema])],
  exports: [CommentRepository],
  providers: [TypeOrmModule, CommentRepository],
})
export class CommentRepositoryModule {}
