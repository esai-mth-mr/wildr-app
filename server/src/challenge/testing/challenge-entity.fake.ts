import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { generateId } from '@verdzie/server/common/generateId';
import { faker } from '@faker-js/faker';
import {
  ChallengeCoverPreset,
  ChallengeCoverType,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.cover';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';

export function ChallengeEntityFake(overrides?: Partial<ChallengeEntity>) {
  const challenge = new ChallengeEntity();
  challenge.authorId = generateId();
  challenge.name = faker.lorem.word(5);
  challenge.state = ExistenceState.ALIVE;
  challenge.cover = {
    type: ChallengeCoverType.PRESET,
    preset: ChallengeCoverPreset.PRESET_1,
  };
  return Object.assign(challenge, overrides);
}
