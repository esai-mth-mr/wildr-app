import { PostCategoryType } from '@verdzie/server/post-category/postCategory.entity';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(PostCategoryType)
  type: PostCategoryType;
}
