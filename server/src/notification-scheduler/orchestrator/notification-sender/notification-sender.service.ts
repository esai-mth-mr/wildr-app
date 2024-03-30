import { Inject, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import {
  FCMService,
  ObjectRoutedFCMData,
} from '@verdzie/server/fcm/fcm.service';
import { WildrMethodLatencyHistogram } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class ScheduledNotificationSenderService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly fcmService: FCMService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @WildrMethodLatencyHistogram()
  async send({
    fcmToken,
    notificationStrings,
    notificationData,
  }: {
    fcmToken: string;
    notificationStrings: {
      title: string;
      body: string;
    };
    notificationData: ObjectRoutedFCMData;
  }): Promise<Result<undefined, InternalServerErrorException>> {
    try {
      await this.fcmService.sendNotifications(
        [fcmToken],
        notificationStrings.title,
        notificationStrings.body,
        notificationData
      );
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException('[send] ' + error, {
          methodName: 'send',
          fcmToken,
          notificationStrings,
          notificationData,
          error,
        })
      );
    }
  }
}
