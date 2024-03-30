import { Module } from '@nestjs/common';
import { AdminCategoryInterestsController } from '@verdzie/server/admin/category-interests/adminCategoryInterests.controller';
import { AdminCategoryInterestsService } from '@verdzie/server/admin/category-interests/adminCategoryInterests.service';
import { PostCategoryModule } from '@verdzie/server/post-category/postCategory.module';

@Module({
  imports: [PostCategoryModule],
  controllers: [AdminCategoryInterestsController],
  providers: [AdminCategoryInterestsService],
  exports: [AdminCategoryInterestsService],
})
export class AdminCategoryInterestsModule {}
