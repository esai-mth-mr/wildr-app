import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class sendNotificationToChallengeParticipantsBodyDto {
  @IsString()
  title: string;
  @IsString()
  body: string;
  @IsString()
  challengeId: string;
  @IsString()
  @IsOptional()
  imageUrl: string | undefined;
  @IsBoolean()
  @IsOptional()
  includeAuthor: boolean | undefined;
}
