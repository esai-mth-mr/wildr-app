import { Args, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { GraphQLExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ReviewReportRequestService } from '@verdzie/server/review-report-request/reviewReportRequest.service';
import { kSomethingWentWrong } from '../../constants';
import {
  GetStrikeReportInput,
  GetStrikeReportOutput,
} from '@verdzie/server/generated-graphql';

@Resolver('ReviewReportRequestResolver')
export class ReviewReportRequestResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private reviewReportRequestService: ReviewReportRequestService
  ) {
    this.logger = this.logger.child({ context: 'ReviewReportRequestResolver' });
  }

  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async getStrikeReport(
    @CurrentUser() currentUser: UserEntity,
    @Args('input') args: GetStrikeReportInput
  ): Promise<GetStrikeReportOutput> {
    const postTypeInterestMap = await this.reviewReportRequestService.findById(
      args.id
    );
    if (postTypeInterestMap == null) {
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    return this.reviewReportRequestService.toGqlObj(postTypeInterestMap);
  }
}
