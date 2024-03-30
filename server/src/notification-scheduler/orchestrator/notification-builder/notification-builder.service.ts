import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
  NotFoundException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  EntityFromEntitySchema,
  NotificationConfigNotFoundException,
  NotificationConfigService,
  NotificationParentType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { WildrMethodLatencyHistogram } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  UserMissingFCMTokenException,
  UserNotFoundException,
} from '@verdzie/server/user/user.service';
import { ScheduledNotificationSenderProducer } from '@verdzie/server/worker/notification-sender/notification-sender.producer';
import { NotificationBuilderJobItem } from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Connection } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class ScheduledNotificationBuilderService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly notificationConfigService: NotificationConfigService,
    private readonly notificationSenderProducer: ScheduledNotificationSenderProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @WildrMethodLatencyHistogram()
  async buildAndEnqueue({
    parentId,
    items,
  }: {
    parentId: string;
    items: NotificationBuilderJobItem[];
  }): Promise<
    Result<
      undefined,
      | EmptyTimepointException
      | NotificationConfigNotFoundException
      | NotFoundException
      | InternalServerErrorException
    >
  > {
    const context = { parentId, methodName: 'buildAndEnqueue' };
    try {
      if (!items.length) {
        return err(new EmptyTimepointException(context));
      }
      const notificationConfig = this.notificationConfigService.get(
        items[0].notificationType
      );
      if (notificationConfig.isErr()) {
        return err(notificationConfig.error);
      }
      const parent = await this.connection
        .getRepository(notificationConfig.value.parentSchema)
        .findOne(parentId);
      if (!parent) {
        return err(
          new NotFoundException('Parent not found', {
            parentId,
            parentType: notificationConfig.value.parentSchema,
            methodName: 'buildAndEnqueue',
          })
        );
      }
      const recipientIds = new Set(items.map(item => item.recipientId));
      const recipients = await this.connection
        .getRepository(UserEntity)
        .findByIds([...recipientIds]);
      for (const item of items) {
        const result = await this.enqueueNotificationForItem({
          item,
          parent,
          recipients,
          context,
        });
        if (result.isErr()) {
          this.logger.error('[buildAndEnqueue]', result.error);
        }
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[buildAndEnqueue] ' + error,
          { error, methodName: 'buildAndEnqueue' },
          error
        )
      );
    }
  }

  private async enqueueNotificationForItem({
    item,
    parent,
    recipients,
    context,
  }: {
    item: NotificationBuilderJobItem;
    parent: EntityFromEntitySchema<NotificationParentType>;
    recipients: UserEntity[];
    context: { parentId: string; methodName: string };
  }): Promise<
    Result<
      undefined,
      | UserNotFoundException
      | UserMissingFCMTokenException
      | NotificationConfigNotFoundException
      | InternalServerErrorException
    >
  > {
    const recipient = recipients.find(
      recipient => recipient.id === item.recipientId
    );
    if (!recipient) {
      return err(
        new UserNotFoundException({ userId: item.recipientId, ...context })
      );
    }
    if (!recipient.fcmToken) {
      return err(
        new UserMissingFCMTokenException({
          userId: item.recipientId,
          ...context,
        })
      );
    }
    const notificationConfigResult = this.notificationConfigService.get(
      item.notificationType
    );
    if (notificationConfigResult.isErr()) {
      notificationConfigResult.error.debugData = {
        ...notificationConfigResult.error.debugData,
        ...context,
      };
      return err(notificationConfigResult.error);
    }
    const notificationDataResult =
      await notificationConfigResult.value.getNotificationData({
        parent,
        recipient,
      });
    if (notificationDataResult.isErr()) {
      notificationDataResult.error.debugData = {
        ...notificationDataResult.error.debugData,
        ...context,
      };
      return err(notificationDataResult.error);
    } else if (!notificationDataResult.value) {
      return ok(undefined);
    }
    const notificationStringResult =
      await notificationConfigResult.value.getNotificationString({
        parent,
        recipient,
        notificationData: notificationDataResult.value,
      });
    if (notificationStringResult.isErr()) {
      notificationStringResult.error.debugData = {
        ...notificationStringResult.error.debugData,
        ...context,
      };
      return err(notificationStringResult.error);
    } else if (!notificationStringResult.value) {
      return ok(undefined);
    }
    const sendNotificationResult =
      await this.notificationSenderProducer.sendNotification({
        fcmToken: recipient.fcmToken,
        notificationStrings: notificationStringResult.value,
        notificationData: notificationDataResult.value,
      });
    if (sendNotificationResult.isErr()) {
      sendNotificationResult.error.debugData = {
        ...sendNotificationResult.error.debugData,
        ...context,
      };
      return err(sendNotificationResult.error);
    }
    return ok(undefined);
  }
}

export class EmptyTimepointException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes>) {
    super('Empty timepoint provided', {
      ...debugData,
    });
  }
}
