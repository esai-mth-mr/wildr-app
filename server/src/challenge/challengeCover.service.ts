import { Inject, Injectable } from '@nestjs/common';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  ChallengeCover as GqlChallengeCover,
  ChallengeCoverEnum,
  ChallengeCoverImage as GqlChallengeCoverImage,
} from '@verdzie/server/generated-graphql';
import { toGqlImageObj, toUrl } from '@verdzie/server/common';
import {
  ChallengeCoverImage,
  ChallengeCoverPreset,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.cover';
import { FileProperties } from '@verdzie/server/post/postProperties';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';

@Injectable()
export class ChallengeCoverService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly s3UrlPresigner: S3UrlPreSigner,
    private readonly cdnPvtS3UrlPresigner: CDNPvtUrlSigner
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async getGqlCover(
    challenge: ChallengeEntity
  ): Promise<GqlChallengeCover | undefined> {
    if (!challenge.cover) {
      this.logger.info('Cover not found', {
        fxtName: 'getGqlCover',
        challengeId: challenge.id,
      });
      return;
    }
    const cover = challenge.cover;
    cover.coverImage = await this.parseCoverImageUrl(challenge);
    const challengeCoverImage: GqlChallengeCoverImage = {
      __typename: 'ChallengeCoverImage',
    };
    if (cover.coverImage) {
      if (cover.coverImage.image)
        challengeCoverImage.image = toGqlImageObj(cover.coverImage.image);
      if (cover.coverImage.thumbnail)
        challengeCoverImage.thumbnail = toGqlImageObj(
          cover.coverImage.thumbnail
        );
    }
    return {
      __typename: 'ChallengeCover',
      coverImageEnum: this.toGqlCoverImageEnum(cover.preset),
      coverImage: challengeCoverImage,
    };
  }

  toGqlCoverImageEnum(
    preset?: ChallengeCoverPreset
  ): ChallengeCoverEnum | undefined {
    if (!preset) return;
    switch (preset) {
      case ChallengeCoverPreset.PRESET_1:
        return ChallengeCoverEnum.TYPE_1;
      case ChallengeCoverPreset.PRESET_2:
        return ChallengeCoverEnum.TYPE_2;
      case ChallengeCoverPreset.PRESET_3:
        return ChallengeCoverEnum.TYPE_3;
      case ChallengeCoverPreset.PRESET_4:
        return ChallengeCoverEnum.TYPE_4;
      case ChallengeCoverPreset.PRESET_5:
        return ChallengeCoverEnum.TYPE_5;
      case ChallengeCoverPreset.PRESET_6:
        return ChallengeCoverEnum.TYPE_6;
      case ChallengeCoverPreset.PRESET_7:
        return ChallengeCoverEnum.TYPE_7;
      case ChallengeCoverPreset.PRESET_8:
        return ChallengeCoverEnum.TYPE_8;
    }
  }

  async parseAllUrls(
    challenges: ChallengeEntity[]
  ): Promise<ChallengeEntity[]> {
    for (const challenge of challenges) {
      const updatedCoverImage = await this.parseCoverImageUrl(challenge);
      if (updatedCoverImage) challenge.cover!.coverImage = updatedCoverImage;
    }
    return challenges;
  }

  async parseCoverImageUrl(
    challenge: ChallengeEntity
  ): Promise<ChallengeCoverImage | undefined> {
    if (!challenge.cover?.coverImage?.image) return;
    challenge.cover.coverImage.image = await this.setImagePath(
      challenge.cover.coverImage.image
    );
    if (challenge.cover.coverImage.thumbnail)
      challenge.cover.coverImage.thumbnail = await this.setImagePath(
        challenge.cover.coverImage.thumbnail
      );
    return challenge.cover.coverImage;
  }

  async setImagePath(
    imageFileProperty: FileProperties
  ): Promise<FileProperties> {
    let imagePath: string | undefined = imageFileProperty.path;
    if (imagePath) {
      try {
        const url = await this.toURL(imagePath);
        imagePath = url.toString();
      } catch (e) {
        this.logger.error(e);
      }
    }
    imageFileProperty.path = imagePath;
    return imageFileProperty;
  }

  toURL(url: string): Promise<URL> {
    return toUrl(
      url,
      this.logger,
      this.s3UrlPresigner,
      this.cdnPvtS3UrlPresigner
    );
  }
}
