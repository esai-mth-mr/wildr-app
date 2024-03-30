import {
  Controller,
  Param,
  Inject,
  Put,
  Delete,
  Get,
  Body,
} from '@nestjs/common';
import {
  AdminChallengeService,
  ChallengeTakeDownResponse,
} from './admin-challenge.service';
import { Logger } from 'winston';
import { FeaturedChallengeUpdateDto } from '@verdzie/server/admin/challenge/dto/featured-challenge-update.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SearchChallengeByNameDto } from '@verdzie/server/admin/challenge/dto/search-challenge-by-name.dto';
import { ReOrderFeaturedChallengesBodyDto } from '@verdzie/server/admin/challenge/dto/re-order-featured-challenges.dto';
import { FeaturedChallengesResponseDto } from '@verdzie/server/admin/challenge/dto/featured-challenges-response.dto';

@Controller('challenge')
export class AdminChallengeController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly service: AdminChallengeService
  ) {}

  @Put(':id/take-down')
  async takeDown(@Param('id') challengeId: string) {
    this.logger.info('takeDown: taking down challenge...', { challengeId });
    const result = await this.service.takeDown(challengeId);
    if (result.isErr()) {
      this.logger.error('error while taking down challenge', {
        challengeId,
        error: result.error,
      });
      throw result.error;
    }
    this.logger.info('takeDown: finished taking down challenge', {
      challengeId,
    });
  }

  @Put(':id/add-to-featured')
  async addToFeatured(
    @Param('id') id: string
  ): Promise<FeaturedChallengeUpdateDto> {
    return this.service.addToFeatured(id);
  }

  @Put(':id/remove-from-featured')
  async removeFromFeatured(
    @Param('id') id: string
  ): Promise<FeaturedChallengeUpdateDto> {
    return this.service.removeFromFeatured(id);
  }

  @Get('/name/:name')
  async searchByName(
    @Param('name') name: string
  ): Promise<SearchChallengeByNameDto> {
    return this.service.findChallengeByName(name);
  }

  @Get('/featured')
  async getFeatured(): Promise<FeaturedChallengesResponseDto> {
    return this.service.getFeaturedChallengesList();
  }

  @Put('/featured')
  async setFeatured(@Body() body: ReOrderFeaturedChallengesBodyDto) {
    const response = await this.service.reOrderFeaturedChallenges({
      challengeIds: body.challengeIds,
      updatedAt: new Date(),
    });
    if (response.isErr()) {
      this.logger.error('[reorderFeatured]', response.error);
      throw response.error;
    }
    return {
      message: 'Featured challenges list reordered',
    };
  }
}
