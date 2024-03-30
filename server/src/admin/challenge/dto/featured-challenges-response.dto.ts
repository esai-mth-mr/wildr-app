import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';

export class FeaturedChallengeListItem {
  id: string;
  name: string;

  constructor(entity: ChallengeEntity) {
    this.id = entity.id;
    this.name = entity.name;
  }
}

export class FeaturedChallengesResponseDto {
  featuredChallenges: FeaturedChallengeListItem[];
  updatedAt: Date;

  constructor(featuredChallenges: ChallengeEntity[], updatedAt: Date) {
    this.featuredChallenges = featuredChallenges.map(
      challenge => new FeaturedChallengeListItem(challenge)
    );
    this.updatedAt = updatedAt;
  }
}
