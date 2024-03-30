import {
  MailGunService,
  WILDR_CONTACT_US_EMAIL,
  WILDR_MAIL_GUN_EMAIL,
} from '@verdzie/server/mail-gun/mail-gun.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import Mailgun from 'mailgun.js';

describe(MailGunService.name, () => {
  let service: MailGunService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [MailGunService],
    });
    service = module.get(MailGunService);
  });

  describe(MailGunService.prototype.sendContactUsEmail.name, () => {
    it('should return ok(true) if mailgun.send is successful', async () => {
      service['client'].messages.create = jest
        .fn()
        .mockResolvedValue(true as any);
      const result = await service.sendContactUsEmail({
        from: 'from',
        subject: 'subject',
        body: 'body',
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(service['client'].messages.create).toBeCalledWith('wildr.com', {
        from: WILDR_MAIL_GUN_EMAIL,
        subject: 'Contact Us: subject',
        text: 'body\n\nfrom: from',
        to: WILDR_CONTACT_US_EMAIL,
      });
    });

    it('should add the name to the text if provided', async () => {
      service['client'].messages.create = jest
        .fn()
        .mockResolvedValue(true as any);
      const result = await service.sendContactUsEmail({
        from: 'from',
        subject: 'subject',
        body: 'body',
        name: 'name',
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(service['client'].messages.create).toBeCalledWith('wildr.com', {
        from: WILDR_MAIL_GUN_EMAIL,
        subject: 'Contact Us: subject',
        text: 'body\n\nfrom: from\nname: name',
        to: WILDR_CONTACT_US_EMAIL,
      });
    });

    it('should return err if mailgun.send is unsuccessful', async () => {
      service['client'].messages.create = jest
        .fn()
        .mockRejectedValue(new Error('error'));
      const result = await service.sendContactUsEmail({
        from: 'from',
        subject: 'subject',
        body: 'body',
      });
      expect(result.isErr()).toBe(true);
    });
  });
});
