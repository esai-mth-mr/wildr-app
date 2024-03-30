import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendTrendingPostNotificationBodyDto {
  @IsString()
  title: string;
  @IsString()
  body: string;
  @IsString()
  postId: string;
  @IsString()
  @IsOptional()
  imageUrl: string | undefined;
  @IsArray()
  @IsOptional()
  handles: string[] | undefined;
}
