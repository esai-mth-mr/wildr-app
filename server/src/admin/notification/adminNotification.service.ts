import { Inject, Injectable } from '@nestjs/common';
import { AdminUserService } from '@verdzie/server/admin/user/adminUser.service';
import {
  FCMData,
  FCMService,
  ObjectRoutedFCMData,
} from '@verdzie/server/fcm/fcm.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { chunk } from 'lodash';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { err, fromPromise, ok, Result } from 'neverthrow';
import { IsNull, Raw, Repository } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { InjectRepository } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { NotificationContentEntity } from '@verdzie/server/admin/notification/notificationContent.entity';
import { ChallengeVisibilityAccess } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import {
  fromChallengeParticipantIdString,
  getChallengeParticipantsFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { addDelay } from '@verdzie/server/common';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { AppRoutes } from '@verdzie/server/admin/notification/appRouteNames';
import { SendGeneralNotificationBodyDto } from '@verdzie/server/admin/notification/dto/send-general-notification.dto';
import { SendChallengeAnnouncementNotificationDto } from '@verdzie/server/admin/notification/dto/send-challenge-announcement-notification.dto';
import { PostgresInsertFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import {
  NotificationCreationInternalErrorException,
  NotificationCreationBadRequestException,
} from '@verdzie/server/exceptions/notification.exception';

type FailedNotification = {
  userId: string;
  error: string;
};

type OffsetFindFailure = {
  offset: number;
  error: string;
};

type NotificationSendError = {
  message: string;
};

@Injectable()
export class AdminNotificationService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private fcmService: FCMService,
    private adminUserService: AdminUserService,
    @InjectRepository(PostEntity)
    private postRepo: Repository<PostEntity>,
    @InjectRepository(ChallengeEntity)
    private challengeRepo: Repository<ChallengeEntity>,
    @InjectRepository(NotificationContentEntity)
    private notificationContentRepo: Repository<NotificationContentEntity>,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async createNotification({
    title,
    message,
    fcmData,
  }: {
    title: string;
    message: string;
    fcmData: FCMData;
  }): Promise<
    Result<
      {
        message: string;
        messageData: {
          title: string;
          message: string;
          fcmData: FCMData;
        };
      },
      | NotificationCreationBadRequestException
      | NotificationCreationInternalErrorException
    >
  > {
    const saveResult = await fromPromise(
      this.notificationContentRepo.save({
        messageData: {
          title: title,
          message: message,
          fcmData: {
            ...fcmData,
          },
        },
      }),
      error => new PostgresInsertFailedException({ error })
    );
    if (saveResult.isErr()) {
      if (saveResult.error instanceof PostgresInsertFailedException) {
        return err(new NotificationCreationBadRequestException({ saveResult }));
      }
      return err(
        new NotificationCreationInternalErrorException({ saveResult })
      );
    }
    return ok({
      message: 'Notification successfully created',
      messageData: {
        title,
        message,
        fcmData,
      },
    });
  }

  private async sendNotificationToGroup({
    title,
    body,
    fcmData,
    imageUrl,
    userIdentifiers,
  }: {
    title: string;
    body: string;
    fcmData: FCMData;
    imageUrl?: string;
    userIdentifiers: {
      fcmToken: string;
      userId: string;
      handle: string;
    }[];
  }): Promise<{
    notificationSentCount: number;
    failedNotifications: FailedNotification[];
  }> {
    let notificationSentCount = 0;
    const failedNotifications: FailedNotification[] = [];
    try {
      await this.fcmService.sendNotifications(
        userIdentifiers.map(u => u.fcmToken),
        title,
        body,
        { ...fcmData },
        imageUrl
      );
      notificationSentCount += userIdentifiers.length;
    } catch (error) {
      failedNotifications.push(
        ...userIdentifiers.map(u => ({
          userId: u.userId,
          error: `${error}`,
        }))
      );
    }
    return {
      notificationSentCount,
      failedNotifications,
    };
  }

  async sendNotificationToListOfUsers({
    title,
    body,
    userIds,
    imageUrl,
    fcmData,
  }: {
    title: string;
    body: string;
    userIds: string[];
    imageUrl?: string;
    fcmData: FCMData;
  }): Promise<{
    message: string;
    notificationSentCount: number;
    warnings: {
      failedNotifications?: FailedNotification[];
    };
  }> {
    if (!userIds.length)
      return {
        message: `No user ids provided.`,
        notificationSentCount: 0,
        warnings: {},
      };
    let notificationSentCount = 0;
    const failedNotifications: FailedNotification[] = [];
    const groupedUsers = chunk(userIds, 20);
    for (const group of groupedUsers) {
      const userIdentifiers =
        await this.adminUserService.getUserIdentifiersFromIds(group);
      this.logger.info(
        '[sendNotificationToListOfUsers] userIdentifiers',
        userIdentifiers
      );
      const groupSendResult = await this.sendNotificationToGroup({
        title,
        body,
        fcmData,
        userIdentifiers,
        imageUrl,
      });
      notificationSentCount += groupSendResult.notificationSentCount;
      failedNotifications.push(...groupSendResult.failedNotifications);
    }
    return {
      message: `Successfully sent notification to ${notificationSentCount} users`,
      notificationSentCount: notificationSentCount,
      warnings: {
        failedNotifications,
      },
    };
  }

  async sendNotificationToAllUsers({
    title,
    body,
    imageUrl,
    fcmData,
    userIdsToSkip,
    findConditions,
  }: {
    title: string;
    body: string;
    imageUrl?: string;
    fcmData: FCMData;
    userIdsToSkip?: string[];
    findConditions?: FindConditions<UserEntity>;
  }): Promise<{
    message: string;
    notificationSentCount: number;
    warnings: {
      failedNotifications?: FailedNotification[];
      failedOffsets?: OffsetFindFailure[];
    };
  }> {
    let notificationSentCount = 0;
    const failedNotifications: FailedNotification[] = [];
    const failedOffsets: OffsetFindFailure[] = [];
    for (let i = 0; ; i++) {
      let userIdentifiers: {
        fcmToken: string;
        userId: string;
        handle: string;
      }[];
      try {
        userIdentifiers =
          await this.adminUserService.getUserIdentifiersFromRange({
            take: 50,
            skip: 50 * i,
            findConditions: findConditions,
          });
      } catch (error) {
        failedOffsets.push({
          offset: i,
          error: `${error}`,
        });
        continue;
      }
      if (userIdentifiers.length === 0) break;
      const sendNotificationToGroupResult = await this.sendNotificationToGroup({
        title,
        body,
        fcmData,
        userIdentifiers: userIdentifiers.filter(
          u => !userIdsToSkip?.includes(u.userId)
        ),
        imageUrl,
      });
      notificationSentCount +=
        sendNotificationToGroupResult.notificationSentCount;
      failedNotifications.push(
        ...sendNotificationToGroupResult.failedNotifications
      );
      await addDelay(400);
    }
    return {
      message: `Successfully sent notification to ${notificationSentCount} users`,
      notificationSentCount,
      warnings: {
        failedOffsets,
        failedNotifications,
      },
    };
  }

  checkPostAvailability(post: PostEntity): {
    isAvailable: boolean;
    message?: string;
  } {
    if (post.willBeDeleted)
      return {
        isAvailable: false,
        message: 'Post will be deleted',
      };
    if (
      post.accessControl?.postVisibilityAccessData.access !==
      PostVisibilityAccess.EVERYONE
    )
      return {
        isAvailable: false,
        message: 'Post is not public',
      };
    return {
      isAvailable: true,
    };
  }

  async sendTrendingPostNotification({
    title,
    body,
    postId,
    imageUrl,
    handles,
  }: {
    title: string;
    body: string;
    postId: string;
    imageUrl?: string;
    handles?: string[];
  }): Promise<
    Result<
      {
        message: string;
        notificationSentCount: number;
        marketingTag: string;
        warnings: {
          failedNotifications?: FailedNotification[];
          failedOffsets?: OffsetFindFailure[];
          notFoundUsers?: string[];
        };
      },
      NotificationSendError
    >
  > {
    const post = await this.postRepo.findOne(postId);
    if (!post)
      return err({
        message: `Post with id ${postId} not found.`,
      });
    const postAvailabilityResult = this.checkPostAvailability(post);
    if (!postAvailabilityResult.isAvailable)
      return err({
        message: postAvailabilityResult.message || 'Post is not available.',
      });
    const marketingTag = new Date().toISOString() + '-trending-post-' + postId;
    const fcmData: ObjectRoutedFCMData = {
      verb: ActivityVerb.POSTED,
      marketing: marketingTag,
      postId,
    };
    if (handles) {
      const users = await this.adminUserService.findByHandles(handles);
      const foundUserHandles = new Set(users.map(u => u.handle));
      const notFoundUsers = handles.filter(h => !foundUserHandles.has(h));
      const sendToUsersResult = await this.sendNotificationToListOfUsers({
        title,
        body,
        userIds: users.filter(u => u.id !== post.authorId).map(u => u.id),
        fcmData,
        imageUrl,
      });
      return ok({
        ...sendToUsersResult,
        marketingTag,
        warnings: {
          notFoundUsers,
          failedNotifications: sendToUsersResult.warnings?.failedNotifications,
        },
      });
    }
    const sendToAllUsersResult = await this.sendNotificationToAllUsers({
      title,
      body,
      imageUrl,
      fcmData,
      userIdsToSkip: [post.authorId],
    });
    return ok({
      ...sendToAllUsersResult,
      marketingTag,
    });
  }

  checkChallengeAvailability(challenge: ChallengeEntity): {
    isAvailable: boolean;
    message?: string;
  } {
    if (challenge.willBeDeleted)
      return {
        isAvailable: false,
        message: 'Challenge will be deleted',
      };
    if (
      challenge.accessControl?.visibilityAccessData.access !==
      ChallengeVisibilityAccess.EVERYONE
    )
      return {
        isAvailable: false,
        message: 'Challenge is not public',
      };
    return {
      isAvailable: true,
    };
  }

  async sendTrendingChallengeNotification({
    title,
    body,
    challengeId,
    imageUrl,
    handles,
  }: {
    title: string;
    body: string;
    challengeId: string;
    imageUrl?: string;
    handles?: string[];
  }): Promise<
    Result<
      {
        message: string;
        notificationSentCount: number;
        marketingTag: string;
        warnings: {
          failedNotifications?: FailedNotification[];
          failedOffsets?: OffsetFindFailure[];
          notFoundUsers?: string[];
        };
      },
      NotificationSendError
    >
  > {
    const challenge = await this.challengeRepo.findOne(challengeId);
    if (!challenge)
      return err({
        message: `Challenge with id ${challengeId} not found.`,
        notificationSentCount: 0,
        marketingTag: '',
        warnings: {},
      });
    const challengeAvailabilityResult =
      this.checkChallengeAvailability(challenge);
    if (!challengeAvailabilityResult.isAvailable)
      return err({
        message:
          challengeAvailabilityResult.message || 'Challenge is not available.',
        notificationSentCount: 0,
        marketingTag: '',
        warnings: {},
      });
    const marketingTag =
      new Date().toISOString() + '-trending-challenge-' + challengeId;
    const fcmData: ObjectRoutedFCMData = {
      verb: ActivityVerb.CHALLENGE_CREATED,
      marketing: marketingTag,
      challengeId,
    };
    if (handles) {
      const users = await this.adminUserService.findByHandles(handles);
      const foundUserHandles = new Set(users.map(u => u.handle));
      const notFoundUsers = handles.filter(h => !foundUserHandles.has(h));
      const sendToUsersResult = await this.sendNotificationToListOfUsers({
        title,
        body,
        userIds: users.filter(u => u.id !== challenge.authorId).map(u => u.id),
        fcmData,
        imageUrl,
      });
      return ok({
        ...sendToUsersResult,
        marketingTag,
        warnings: {
          notFoundUsers,
          failedNotifications: sendToUsersResult.warnings?.failedNotifications,
        },
      });
    }
    const sendToAllUsersResult = await this.sendNotificationToAllUsers({
      title,
      body,
      imageUrl,
      fcmData,
      userIdsToSkip: [challenge.authorId],
    });
    return ok({
      ...sendToAllUsersResult,
      marketingTag,
    });
  }

  async sendNotificationToChallengeParticipants({
    title,
    body,
    challengeId,
    imageUrl,
    includeAuthor,
  }: {
    title: string;
    body: string;
    challengeId: string;
    imageUrl?: string;
    includeAuthor?: boolean;
  }): Promise<
    Result<
      {
        message: string;
        notificationSentCount: number;
        marketingTag: string;
        warnings: {
          failedNotifications?: FailedNotification[];
          failedOffsets?: OffsetFindFailure[];
          notFoundUsers?: string[];
        };
      },
      NotificationSendError
    >
  > {
    const challenge = await this.challengeRepo.findOne(challengeId);
    if (!challenge) {
      return err({
        message: `Challenge with id ${challengeId} not found.`,
        notificationSentCount: 0,
        marketingTag: '',
        warnings: {},
      });
    }
    if (challenge.willBeDeleted) {
      return err({
        message: `Challenge with id ${challengeId} will be deleted.`,
        notificationSentCount: 0,
        marketingTag: '',
        warnings: {},
      });
    }
    const marketingTag =
      new Date().toISOString() + '-challenge-participants-' + challengeId;
    const fcmData: ObjectRoutedFCMData = {
      verb: ActivityVerb.CHALLENGE_CREATED,
      marketing: marketingTag,
      challengeId,
    };
    const participantsFeed = await this.feedService.getAllEntriesFromEveryPage({
      feedId: getChallengeParticipantsFeedId(challengeId),
    });
    let notificationSentCount = 0;
    let failedNotifications: FailedNotification[] = [];
    const userIds: string[] = [];
    for (const id of participantsFeed.stitchedIdsList) {
      const userId = fromChallengeParticipantIdString(id)?.id;
      if (userId) {
        if (userId !== challenge.authorId || includeAuthor) {
          userIds.push(userId);
        }
      } else {
        failedNotifications.push({
          userId: id,
          error: 'Bad challenge participant id',
        });
      }
    }
    try {
      const sendToUsersResult = await this.sendNotificationToListOfUsers({
        title,
        body,
        userIds,
        fcmData,
        imageUrl,
      });
      notificationSentCount += sendToUsersResult.notificationSentCount;
      if (sendToUsersResult.warnings?.failedNotifications) {
        failedNotifications = failedNotifications.concat(
          sendToUsersResult.warnings?.failedNotifications
        );
      }
    } catch (error) {
      this.logger.error(
        '[sendNotificationToChallengeParticipants] sending notification to users',
        error
      );
      for (const userId of userIds) {
        if (error instanceof Error) {
          failedNotifications.push({
            userId: userId,
            error: error.message,
          });
        }
      }
    }
    return ok({
      message: `Notification sent to ${notificationSentCount} challenge participants`,
      notificationSentCount,
      marketingTag,
      warnings: {
        failedNotifications,
      },
    });
  }

  //Sends notification to all the users that have not participated in any challenge
  async sendChallengeLaunchAnnouncement(
    input: SendChallengeAnnouncementNotificationDto
  ): Promise<{
    message: string;
    notificationSentCount: number;
    warnings: {
      failedNotifications?: FailedNotification[];
      failedOffsets?: OffsetFindFailure[];
    };
  }> {
    const fcmData: FCMData = {
      marketing: input.marketingTag,
      route: AppRoutes.getChallengeAnnouncementRoute(),
    };
    const title = input.title;
    const body = input.body;
    const imageUrl = input.imageUrl;
    if (input.userIds) {
      const groupedUsers = chunk(input.userIds, 20);
      let notificationSentCount = 0;
      const failedNotifications: FailedNotification[] = [];
      for (const group of groupedUsers) {
        const userIdentifiers =
          await this.adminUserService.getUserIdentifiersFromIds(group);
        this.logger.info(
          '[sendNotificationToListOfUsers] userIdentifiers',
          userIdentifiers
        );
        const groupSendResult = await this.sendNotificationToGroup({
          title,
          body,
          fcmData,
          userIdentifiers,
          imageUrl,
        });
        notificationSentCount += groupSendResult.notificationSentCount;
        failedNotifications.push(...groupSendResult.failedNotifications);
      }
      return {
        message: `Successfully sent notification to ${notificationSentCount} users`,
        notificationSentCount: notificationSentCount,
        warnings: {
          failedNotifications,
        },
      };
    }
    return await this.sendNotificationToAllUsers({
      title: input.title,
      body: input.body,
      fcmData,
      findConditions: {
        challengeContext: IsNull(),
        onboardingStats: Raw(
          onboardingStats =>
            `${onboardingStats} #> '{challengeEducation}' is null`
        ),
      },
    });
  }
}

export const prepareFCMDataFromBody = (
  body: SendGeneralNotificationBodyDto
): FCMData => {
  return {
    marketing: body.marketingTag,
    route: (body.routes && body.routes.join('/')) ?? body.routeName,
    verb: body.verb,
    challengeId: body.challengeId,
    postId: body.postId,
    userId: body.userId,
  };
};
