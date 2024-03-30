import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendChallengeAnnouncementNotificationDto {
  @IsString()
  title: string;
  @IsString()
  body: string;
  @IsString()
  @IsOptional()
  marketingTag: string | undefined;
  @IsString()
  @IsOptional()
  imageUrl: string | undefined;
  @IsOptional()
  @IsArray()
  userIds?: string[];
}
