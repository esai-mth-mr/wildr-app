import { MailService } from '@verdzie/server/mail/mail.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { err, ok } from 'neverthrow';

describe(MailService.name, () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [MailService],
    });
    service = module.get(MailService);
  });

  describe(MailService.prototype.sendContactUsEmail.name, () => {
    it('should send the email', async () => {
      service['mailGunService'].sendContactUsEmail = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const payload = {
        from: 'brain@brain.com',
        subject: 'subject',
        body: 'body',
      };
      const result = await service.sendContactUsEmail(payload);
      expect(result.isOk()).toBe(true);
      expect(service['mailGunService'].sendContactUsEmail).toBeCalledWith(
        payload
      );
    });

    it('should send the mail with a name', async () => {
      service['mailGunService'].sendContactUsEmail = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const payload = {
        from: 'brain@brain.com',
        subject: 'subject',
        body: 'body',
        name: 'name',
      };
      const result = await service.sendContactUsEmail(payload);
      expect(result.isOk()).toBe(true);
      expect(service['mailGunService'].sendContactUsEmail).toBeCalledWith(
        payload
      );
    });

    it('should return an error if the email fails to send', async () => {
      service['mailGunService'].sendContactUsEmail = jest
        .fn()
        .mockResolvedValueOnce(err(new Error('error')));
      const payload = {
        from: 'brain@brain.com',
        subject: 'subject',
        body: 'body',
      };
      const result = await service.sendContactUsEmail(payload);
      expect(result.isErr()).toBe(true);
    });
  });
});
