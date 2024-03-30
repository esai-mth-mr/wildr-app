import { kSomethingWentWrong } from '@verdzie/server/common';
import { SendContactUsEmailInput } from '@verdzie/server/generated-graphql';
import { MailResolver } from '@verdzie/server/mail/mail.resolver';
import { WildrRateLimiterModule } from '@verdzie/server/rate-limiter/rate-limiter.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { err, ok } from 'neverthrow';

describe(MailResolver.name, () => {
  let resolver: MailResolver;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      imports: [WildrRateLimiterModule],
      providers: [MailResolver],
    });
    resolver = module.get(MailResolver);
  });

  describe(MailResolver.prototype.sendContactUsEmail.name, () => {
    it('should send the email', async () => {
      resolver['mailService'].sendContactUsEmail = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const payload: SendContactUsEmailInput = {
        name: 'bain',
        from: 'bain@bain.com',
        subject: 'i like wildr',
        body: 'wildr is the best',
      };
      const result = await resolver.sendContactUsEmail(payload);
      expect(result).toEqual({
        __typename: 'SendContactUsEmailResult',
        success: true,
      });
    });

    it('should return an error', async () => {
      resolver['mailService'].sendContactUsEmail = jest
        .fn()
        .mockResolvedValueOnce(err(new Error('mailgun is busted')));
      const payload: SendContactUsEmailInput = {
        name: 'bain',
        from: 'bain@bain.com',
        subject: 'i like wildr',
        body: 'wildr is the best',
      };
      const result = await resolver.sendContactUsEmail(payload);
      expect(result).toEqual({
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      });
    });
  });
});
