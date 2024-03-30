import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendTrendingChallengeNotificationBodyDto {
  @IsString()
  title: string;
  @IsString()
  body: string;
  @IsString()
  challengeId: string;
  @IsString()
  @IsOptional()
  imageUrl: string | undefined;
  @IsArray()
  @IsOptional()
  handles: string[] | undefined;
}
