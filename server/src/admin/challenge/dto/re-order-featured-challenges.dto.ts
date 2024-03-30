import { IsArray } from 'class-validator';

export class ReOrderFeaturedChallengesBodyDto {
  @IsArray()
  challengeIds: string[];
}
