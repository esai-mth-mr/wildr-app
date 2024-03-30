import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCategoryService } from '@verdzie/server/post-category/postCategory.service';
import { PostCategorySchema } from '@verdzie/server/post-category/postCategory.schema';
import { PostCategoryResolver } from '@verdzie/server/post-category/postCategory.resolver';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostCategorySchema]), UserModule],
  providers: [PostCategoryService, PostCategoryResolver],
  exports: [PostCategoryService, PostCategoryResolver],
})
export class PostCategoryModule {}
