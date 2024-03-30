import { Inject, Injectable } from '@nestjs/common';
import * as Firebase from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import {
  DataMessagePayload,
  MessagingOptions,
  NotificationMessagePayload,
} from 'firebase-admin/lib/messaging/messaging-api';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { filterNonNullValues } from '@verdzie/server/common';

@Injectable()
export class FCMService {
  private firebase: Firebase.app.App;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private firebaseService: FirebaseService
  ) {
    this.logger = this.logger.child({ context: 'FCMService' });
    this.firebase = firebaseService.app;
  }

  async sendNotifications(
    fcmTokens: string[],
    title: string,
    body: string,
    data: FCMData,
    imageUrl?: string
  ) {
    const context = {
      methodName: FCMService.prototype.sendNotifications.name,
      fcmTokens,
      title,
      body,
      data,
      imageUrl,
    };
    const notification: NotificationMessagePayload = {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    };
    const dataPayload: DataMessagePayload = {
      title,
      body,
      ...data,
    };
    this.logger.info(`sending notifications`, context);
    return this.firebase.messaging().sendToDevice(fcmTokens, {
      notification,
      data: filterNonNullValues(dataPayload),
    });
  }

  async sendNotification(
    fcmToken: string,
    bodyStr: string,
    data: FCMDataMessagePayload
  ) {
    const context = {
      methodName: FCMService.prototype.sendNotification.name,
      fcmToken,
      bodyStr,
      data,
    };
    const options: MessagingOptions = {
      priority: 'normal',
    };
    const filteredData = filterNonNullValues(data);

    this.logger.info('sending notification', context);

    return this.firebase.messaging().sendToDevice(
      fcmToken,
      {
        notification: {
          title: 'Wildr',
          body: bodyStr,
        },
        data: filteredData,
      },
      options
    );
  }
}

export interface FCMDataMessagePayload {
  verb: string;
  [key: string]: string | undefined;
}

export interface AdditionalNotificationMessagePayload {
  marketing?: string;
  routeName?: string;
}

/**
 * Data payload parsed by client analytics
 * Valid keys are defined here
 * https://github.com/wildr-inc/app/blob/challenges-fe-merge/wildr_flutter/lib/constants/analytics_parameters.dart#L1
 */
export interface FCMData {
  verb?: ActivityVerb;
  postId?: string;
  commentId?: string;
  challengeId?: string;
  replyId?: string;
  marketing?: string;
  routeName?: string; //Deprecated
  route?: string;
  userId?: string;
}

/**
 * Notifications that route to a specific screen based on an id must have a verb
 */
export interface ObjectRoutedFCMData extends FCMData {
  verb: ActivityVerb;
}
