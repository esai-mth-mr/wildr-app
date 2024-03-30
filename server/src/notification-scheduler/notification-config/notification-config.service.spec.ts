import {
  NotificationConfigNotFoundException,
  NotificationConfigService,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe(NotificationConfigService.name, () => {
  let service: NotificationConfigService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [NotificationConfigService],
    });
    service = module.get(NotificationConfigService);
  });

  describe(NotificationConfigService.prototype.get, () => {
    it('should return matching notification configs', () => {
      const config = {
        type: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        parentSchema: 'parentSchema',
        time: 0,
        getStartAndEnd: () => [0, 0],
        getNotificationData: () => ({}),
        getNotificationString: () => '',
      };
      // @ts-expect-error
      service['notificationConfigs'] = {
        [ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY]: config,
      };
      expect(
        service
          .get(ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY)
          ._unsafeUnwrap()
      ).toEqual(config);
    });

    it('should return error if no matching notification config', () => {
      expect(service.get(20)._unsafeUnwrapErr()).toBeInstanceOf(
        NotificationConfigNotFoundException
      );
    });
  });
});
