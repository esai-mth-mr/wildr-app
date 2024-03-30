import { ParticipationType } from '../graphql';

export const getParticipationTypeValueFrom = (
  type: ParticipationType
): number => {
  switch (type) {
    case ParticipationType.FINAL:
      return 0;
    case ParticipationType.OPEN:
      return 1;
  }
};

export const getParticipationTypeEnumFrom = (
  value: number
): ParticipationType => {
  switch (value) {
    case 1:
      return ParticipationType.OPEN;
    default:
      return ParticipationType.FINAL;
  }
};
