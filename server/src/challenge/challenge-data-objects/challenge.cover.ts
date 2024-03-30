import { FileProperties } from '@verdzie/server/post/postProperties';
import { ChallengeCoverEnum as GqlChallengeCoverEnum } from '@verdzie/server/generated-graphql';

export enum ChallengeCoverType {
  UNDEFINED = 0,
  IMAGE_UPLOAD = 1,
  PRESET = 2,
}

export enum ChallengeCoverPreset {
  PRESET_1 = 1,
  PRESET_2 = 2,
  PRESET_3 = 3,
  PRESET_4 = 4,
  PRESET_5 = 5,
  PRESET_6 = 6,
  PRESET_7 = 7,
  PRESET_8 = 8,
}

export const fromGqlChallengeCoverPreset = (
  gqlEnum: GqlChallengeCoverEnum
): ChallengeCoverPreset => {
  switch (gqlEnum) {
    case GqlChallengeCoverEnum.TYPE_1:
      return ChallengeCoverPreset.PRESET_1;
    case GqlChallengeCoverEnum.TYPE_2:
      return ChallengeCoverPreset.PRESET_2;
    case GqlChallengeCoverEnum.TYPE_3:
      return ChallengeCoverPreset.PRESET_3;
    case GqlChallengeCoverEnum.TYPE_4:
      return ChallengeCoverPreset.PRESET_4;
    case GqlChallengeCoverEnum.TYPE_5:
      return ChallengeCoverPreset.PRESET_5;
    case GqlChallengeCoverEnum.TYPE_6:
      return ChallengeCoverPreset.PRESET_6;
    case GqlChallengeCoverEnum.TYPE_7:
      return ChallengeCoverPreset.PRESET_7;
    case GqlChallengeCoverEnum.TYPE_8:
      return ChallengeCoverPreset.PRESET_8;
  }
};

export const toGqlChallengeCoverPreset = (
  coverPreset: ChallengeCoverPreset
): GqlChallengeCoverEnum => {
  switch (coverPreset) {
    case ChallengeCoverPreset.PRESET_1:
      return GqlChallengeCoverEnum.TYPE_1;
    case ChallengeCoverPreset.PRESET_2:
      return GqlChallengeCoverEnum.TYPE_2;
    case ChallengeCoverPreset.PRESET_3:
      return GqlChallengeCoverEnum.TYPE_3;
    case ChallengeCoverPreset.PRESET_4:
      return GqlChallengeCoverEnum.TYPE_4;
    case ChallengeCoverPreset.PRESET_5:
      return GqlChallengeCoverEnum.TYPE_5;
    case ChallengeCoverPreset.PRESET_6:
      return GqlChallengeCoverEnum.TYPE_6;
    case ChallengeCoverPreset.PRESET_7:
      return GqlChallengeCoverEnum.TYPE_7;
    case ChallengeCoverPreset.PRESET_8:
      return GqlChallengeCoverEnum.TYPE_8;
  }
};

export interface ChallengeCoverImage {
  image?: FileProperties;
  thumbnail?: FileProperties;
}

export interface ChallengeCover {
  type: ChallengeCoverType;
  coverImage?: ChallengeCoverImage;
  preset?: ChallengeCoverPreset;
}
