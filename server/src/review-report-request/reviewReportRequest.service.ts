import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { generateId } from '../common/generateId';
import {
  ReviewReportRequest,
  ViolatedGuideline as GqlViolatedGuideline,
} from '../generated-graphql';
import { ReportEntity, ReportObjectTypeEnum } from '../report/report.entity';
import { StrikeProducer } from '../worker/strike/strike.producer';
import {
  ReportReviewResutEnum,
  ReportReviewStateEnum,
  ReviewReportRequestEntity,
} from './reviewReportRequest.entity';
import { StrikeService } from '@verdzie/server/strike/strike.service';
import { PostService } from '@verdzie/server/post/post.service';
import { CommentService } from '@verdzie/server/comment/comment.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { UserService } from '@verdzie/server/user/user.service';
import { ViolatedGuideline } from '@verdzie/server/review-report-request/violatedGuideline.enum';

/**
 * Will Create ReviewRequestEntity
 * Will update the reviewRequest based on moderator's action
 * Will trigger Score and Strike worker to update user's score
 */
@Injectable()
export class ReviewReportRequestService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly strikeWorker: StrikeProducer,
    @InjectRepository(ReviewReportRequestEntity)
    private repo: Repository<ReviewReportRequestEntity>,
    private strikeService: StrikeService,
    private postService: PostService,
    private commentService: CommentService,
    private replyService: ReplyService,
    private userService: UserService
  ) {
    this.logger = this.logger.child({ context: 'ReportService ' });
  }

  async createRequestIfNeeded(
    report: ReportEntity
  ): Promise<ReviewReportRequestEntity | undefined> {
    this.logger.debug('createRequestIfNeeded()');
    let request = await this.findByReportedObjectId(report.objectId);
    if (request) {
      if (request.getReviewState() === ReportReviewStateEnum.DONE) {
        return;
      }
      //----------------Maybe not needed
      request.reportIds?.push(report.id);
      request.reportsCount += 1;
      await this.update(request);
      //----------------

      // //TODO: REMOVE
      // if ((report.getReportType() as ReportType) === ReportType.FIVE) {
      //   this.updateRequestData(
      //     request.id,
      //     'reviewer',
      //     ReportReviewStateEnum.DONE,
      //     'Yes, this is a valid report',
      //     ReportReviewResutEnum.ACCEPT,
      //   );
      // } else if (report.getReportType() === ReportType.FOUR) {
      //   this.updateRequestData(
      //     request.id,
      //     'reviewer',
      //     ReportReviewStateEnum.DONE,
      //     'Yes, this is not a valid report',
      //     ReportReviewResutEnum.REJECT,
      //   );
      // }
      return request;
    }
    this.logger.debug('Creating new reviewReportRequestEntity()');
    request = new ReviewReportRequestEntity();
    request.id = generateId();
    request.readableNumericId = Date.now();
    request.reportedObjectId = report.objectId;
    request.reportedObjectType = report.objectType;
    request.reportedObjectAuthorId = report.objectAuthorId;
    request.setReviewState(ReportReviewStateEnum.PENDING_REVIEW);
    request.setReviewResult(ReportReviewResutEnum.UNKNOWN);
    request.createdAt = new Date();
    request.updatedAt = request.createdAt;
    request.reportsCount = 1;
    request.reportIds = [report.id];
    await this.repo.save(request);
    return request;
  }

  async updateReportData(
    id: string,
    reviewerId: string,
    reviewState: ReportReviewStateEnum,
    reviewResult: ReportReviewResutEnum,
    reviewerComment?: string,
    violatedGuideline?: ViolatedGuideline,
    useWorker = true
  ): Promise<ReviewReportRequestEntity | undefined> {
    const request = await this.repo.findOne(id);
    if (!request) {
      return;
    }
    request.reviewerId = reviewerId;
    request.reviewerComment = reviewerComment;
    request.setReviewState(reviewState);
    request.setReviewResult(reviewResult);
    request.violatedGuideline = violatedGuideline;
    if (reviewResult === ReportReviewResutEnum.ACCEPT) {
      //Add strike to user
      if (useWorker) {
        await this.strikeWorker.imposeStrike({
          reportReviewRequestId: request.id,
          userId: request.reportedObjectAuthorId,
        });
        //TODO: Remove the object (except a user)
      } else {
        await this.strikeService.imposeStrike(
          request.reportedObjectAuthorId,
          request.id
        );
      }
      if (request.reportedObjectType === ReportObjectTypeEnum.POST) {
        const user = await this.userService.findById(
          request.reportedObjectAuthorId
        );
        if (!user) return;
        await this.postService.softDelete(request.reportedObjectId, user);
      } else if (request.reportedObjectType === ReportObjectTypeEnum.COMMENT) {
        await this.commentService.softDelete(request.reportedObjectId);
      } else if (request.reportedObjectType === ReportObjectTypeEnum.REPLY) {
        await this.replyService.softDelete(request.reportedObjectId);
      }
    }
    return await this.repo.save(request);
  }

  //DB Operations
  async update(request: ReviewReportRequestEntity) {
    await this.repo.save(request);
  }

  async findByReportedObjectId(
    reportedObjectId: string
  ): Promise<ReviewReportRequestEntity | undefined> {
    return await this.repo.findOne({ reportedObjectId });
  }

  async findById(id?: string): Promise<ReviewReportRequestEntity | undefined> {
    return await this.repo.findOne(id);
  }

  //Graphql
  public toGqlObj(entity: ReviewReportRequestEntity): ReviewReportRequest {
    return {
      __typename: 'ReviewReportRequest',
      id: entity.id,
      readableId: entity.readableNumericId.toString(), //Changed to string as number is to large for an Int32
      comment: entity.reviewerComment,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      violatedGuideline: this.toGqlViolatedGuideline(
        entity.violatedGuideline ?? ViolatedGuideline.NONE
      ),
      link: this.toLink(entity.violatedGuideline ?? ViolatedGuideline.NONE),
    };
  }

  toGqlViolatedGuideline(value: ViolatedGuideline): GqlViolatedGuideline {
    switch (value) {
      case ViolatedGuideline.NONE:
        return GqlViolatedGuideline.NONE;
      case ViolatedGuideline.INTRODUCTION:
        return GqlViolatedGuideline.INTRODUCTION;
      case ViolatedGuideline.VIOLENT_EXTREMISM:
        return GqlViolatedGuideline.VIOLENT_EXTREMISM;
      case ViolatedGuideline.THREATS_AND_INCITEMENT_TO_VIOLENCE:
        return GqlViolatedGuideline.THREATS_AND_INCITEMENT_TO_VIOLENCE;
      case ViolatedGuideline.DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS:
        return GqlViolatedGuideline.DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS;
      case ViolatedGuideline.HATEFUL_BEHAVIOR:
        return GqlViolatedGuideline.HATEFUL_BEHAVIOR;
      case ViolatedGuideline.ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS:
        return GqlViolatedGuideline.ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS;
      case ViolatedGuideline.CRIMINAL_ACTIVITIES:
        return GqlViolatedGuideline.CRIMINAL_ACTIVITIES;
      case ViolatedGuideline.WEAPONS:
        return GqlViolatedGuideline.WEAPONS;
      case ViolatedGuideline.DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO:
        return GqlViolatedGuideline.DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO;
      case ViolatedGuideline.FRAUDS_AND_SCAMS:
        return GqlViolatedGuideline.FRAUDS_AND_SCAMS;
      case ViolatedGuideline.GAMBLING:
        return GqlViolatedGuideline.GAMBLING;
      case ViolatedGuideline.PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII:
        return GqlViolatedGuideline.PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII;
      case ViolatedGuideline.VIOLENT_AND_GRAPHIC_CONTENT:
        return GqlViolatedGuideline.VIOLENT_AND_GRAPHIC_CONTENT;
      case ViolatedGuideline.SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS:
        return GqlViolatedGuideline.SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS;
      case ViolatedGuideline.SUICIDE:
        return GqlViolatedGuideline.SUICIDE;
      case ViolatedGuideline.SELF_HARM_AND_EATING_DISORDERS:
        return GqlViolatedGuideline.SELF_HARM_AND_EATING_DISORDERS;
      case ViolatedGuideline.DANGEROUS_ACTS:
        return GqlViolatedGuideline.DANGEROUS_ACTS;
      case ViolatedGuideline.TROLLING_HARASSMENT_AND_BULLYING:
        return GqlViolatedGuideline.TROLLING_HARASSMENT_AND_BULLYING;
      case ViolatedGuideline.TROLLING_AND_ABUSIVE_BEHAVIOR:
        return GqlViolatedGuideline.TROLLING_AND_ABUSIVE_BEHAVIOR;
      case ViolatedGuideline.SEXUAL_HARASSMENT:
        return GqlViolatedGuideline.SEXUAL_HARASSMENT;
      case ViolatedGuideline.THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL:
        return GqlViolatedGuideline.THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL;
      case ViolatedGuideline.ADULT_NUDITY_AND_SEXUAL_ACTIVITIES:
        return GqlViolatedGuideline.ADULT_NUDITY_AND_SEXUAL_ACTIVITIES;
      case ViolatedGuideline.SEXUAL_EXPLOITATION:
        return GqlViolatedGuideline.SEXUAL_EXPLOITATION;
      case ViolatedGuideline.NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS:
        return GqlViolatedGuideline.NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS;
      case ViolatedGuideline.MINOR_SAFETY:
        return GqlViolatedGuideline.MINOR_SAFETY;
      case ViolatedGuideline.INTEGRITY_AND_AUTHENTICITY:
        return GqlViolatedGuideline.INTEGRITY_AND_AUTHENTICITY;
      case ViolatedGuideline.PLATFORM_SECURITY:
        return GqlViolatedGuideline.PLATFORM_SECURITY;
      default:
        return GqlViolatedGuideline.NONE;
    }
  }

  toLink(value: ViolatedGuideline): string {
    let link: string =
      (process.env.WEBSITE_URL ?? 'https://wildr.com') +
      '/legal/community-guidelines#';
    switch (value) {
      case ViolatedGuideline.NONE:
        link += '';
        break;
      case ViolatedGuideline.INTRODUCTION:
        link += '1-introduction';
        break;
      case ViolatedGuideline.VIOLENT_EXTREMISM:
        link += '2-violent-extremism';
        break;
      case ViolatedGuideline.THREATS_AND_INCITEMENT_TO_VIOLENCE:
        link += '3-threats-and-incitement-to-violence';
        break;
      case ViolatedGuideline.DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS:
        link += '4-dangerous-individuals-and-organizations';
        break;
      case ViolatedGuideline.HATEFUL_BEHAVIOR:
        link += '5-hateful-behavior';
        break;
      case ViolatedGuideline.ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS:
        link += '6-illegal-activities-and-regulated-goods';
        break;
      case ViolatedGuideline.CRIMINAL_ACTIVITIES:
        link += '7-criminal-activities';
        break;
      case ViolatedGuideline.WEAPONS:
        link += '8-weapons';
        break;
      case ViolatedGuideline.DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO:
        link += '9-drugs-controlled-substances-alcohol-and-tobacco';
        break;
      case ViolatedGuideline.FRAUDS_AND_SCAMS:
        link += '10-frauds-and-scams';
        break;
      case ViolatedGuideline.GAMBLING:
        link += '11-gambling';
        break;
      case ViolatedGuideline.PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII:
        link +=
          '12-privacy-personal-data-and-personally-identifiable-information-pii';
        break;
      case ViolatedGuideline.VIOLENT_AND_GRAPHIC_CONTENT:
        link += '13-violent-and-graphic-content';
        break;
      case ViolatedGuideline.SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS:
        link += '14-suicide-self-harm-and-dangerous-acts';
        break;
      case ViolatedGuideline.SUICIDE:
        link += '15-suicide';
        break;
      case ViolatedGuideline.SELF_HARM_AND_EATING_DISORDERS:
        link += '16-self-harm-and-eating-disorders';
        break;
      case ViolatedGuideline.DANGEROUS_ACTS:
        link += '17-dangerous-acts';
        break;
      case ViolatedGuideline.TROLLING_HARASSMENT_AND_BULLYING:
        link += '18-trolling-harassment-and-bullying';
        break;
      case ViolatedGuideline.TROLLING_AND_ABUSIVE_BEHAVIOR:
        link += '19-trolling-and-abusive-behavior';
        break;
      case ViolatedGuideline.SEXUAL_HARASSMENT:
        link += '20-sexual-harassment';
        break;
      case ViolatedGuideline.THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL:
        link += '21-threats-of-hacking-doxxing-and-blackmail';
        break;
      case ViolatedGuideline.ADULT_NUDITY_AND_SEXUAL_ACTIVITIES:
        link += '22-adult-nudity-and-sexual-activities';
        break;
      case ViolatedGuideline.SEXUAL_EXPLOITATION:
        link += '23-sexual-exploitation';
        break;
      case ViolatedGuideline.NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS:
        link += '24-nudity-and-sexual-activity-involving-adults';
        break;
      case ViolatedGuideline.MINOR_SAFETY:
        link += '25-minor-safety';
        break;
      case ViolatedGuideline.INTEGRITY_AND_AUTHENTICITY:
        link += '26-integrity-and-authenticity';
        break;
      case ViolatedGuideline.PLATFORM_SECURITY:
        link += '27-platform-security';
        break;
    }
    return link;
  }
}
