import { PostCategoryType } from '@verdzie/server/post-category/postCategory.entity';
import { IsNotEmpty, IsString, IsEnum, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  name: string;

  @IsEnum(PostCategoryType)
  type: PostCategoryType;
}
