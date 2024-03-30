import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { ValidationException } from '@verdzie/server/exceptions/ValidationException';
import { SendContactUsEmailInput } from '@verdzie/server/graphql';
import { MailGunService } from '@verdzie/server/mail-gun/mail-gun.service';
import { MailResolverModule } from '@verdzie/server/mail/mail.resolver.module';
import { WildrRateLimiterModule } from '@verdzie/server/rate-limiter/rate-limiter.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { last } from 'lodash';
import supertest from 'supertest';

describe('Mail (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let mailGunService: MailGunService;

  beforeAll(async () => {
    module = await createMockedTestingModule({
      imports: [
        GraphQLWithUploadModule.forRoot(),
        WildrRateLimiterModule,
        MailResolverModule,
      ],
    });
    mailGunService = module.get(MailGunService);
    mailGunService['client'] = {
      messages: {
        create: jest.fn(),
      },
    };
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        validationError: {
          target: false,
        },
        errorHttpStatusCode: 400,
        exceptionFactory: (errors: ValidationError[]): ValidationException => {
          return new ValidationException(errors);
        },
      })
    );
    await app.init();
  });

  beforeEach(() => {
    mailGunService = module.get(MailGunService);
    mailGunService['client'] = {
      messages: {
        create: jest.fn(),
      },
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('sendContactUsEmail', () => {
    const sendContactUsEmailMutation = /* GraphQL */ `
      mutation SendContactUsEmail($input: SendContactUsEmailInput!) {
        sendContactUsEmail(input: $input) {
          __typename
          ... on SendContactUsEmailResult {
            success
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should send contact us email', async () => {
      const input: SendContactUsEmailInput = {
        name: 'brain',
        from: 'brain@brain.com',
        subject: 'hello',
        body: 'world',
      };
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: sendContactUsEmailMutation,
          variables: { input },
        })
        .expect(200);
      expect(result.body.data.sendContactUsEmail).toEqual({
        __typename: 'SendContactUsEmailResult',
        success: true,
      });
      expect(mailGunService['client'].messages.create).toHaveBeenCalledWith(
        'wildr.com',
        {
          from: 'wildrbot@wildr.com',
          subject: 'Contact Us: hello',
          text: 'world\n\nfrom: brain@brain.com\nname: brain',
          to: 'contact@wildr.com',
        }
      );
    });

    it('should rate limit', async () => {
      const input: SendContactUsEmailInput = {
        name: 'brain',
        from: 'brain@brain.com',
        subject: 'hello',
        body: 'world',
      };
      const clientIp = '10.1.1.1';
      const results = [];
      for (let i = 0; i < 2; i++) {
        results.push(
          supertest(app.getHttpServer())
            .post('/graphql')
            .set('X-Forwarded-For', clientIp)
            .send({
              query: sendContactUsEmailMutation,
              variables: { input },
            })
        );
      }
      const result = await Promise.all(results);
      expect(result[0].body.data.sendContactUsEmail).toEqual({
        __typename: 'SendContactUsEmailResult',
        success: true,
      });
      expect(last(result)!.body.data.sendContactUsEmail).toEqual({
        __typename: 'SmartError',
        message: 'Too Many Requests',
      });
    });

    it('should reject invalid email', async () => {
      const input: SendContactUsEmailInput = {
        name: 'brain',
        from: 'b',
        subject: 'hello',
        body: 'world',
      };
      const clientIp = '10.0.0.0';
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('X-Forwarded-For', clientIp)
        .send({
          query: sendContactUsEmailMutation,
          variables: { input },
        })
        .expect(200);
      expect(result.body.data.sendContactUsEmail).toEqual({
        __typename: 'SmartError',
        message: 'Oops, something went wrong',
      });
    });
  });
});
