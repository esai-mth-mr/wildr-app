import { Inject, Injectable } from '@nestjs/common';
import { replace } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SSMParamsService } from '../ssm-params/ssm-params.service';
import { google } from 'googleapis';
import { GoogleAuthOptions } from 'google-auth-library';

@Injectable()
export class GoogleApiService {
  private options: GoogleAuthOptions;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'GoogleApiService' });
    this.options = {
      credentials: {
        type: SSMParamsService.Instance.firebaseParams.FIREBASE_TYPE,
        private_key: replace(
          SSMParamsService.Instance.firebaseParams.FIREBASE_PRIVATE_KEY ?? '',
          /\\n/g,
          '\n'
        ),
        client_email:
          SSMParamsService.Instance.firebaseParams.FIREBASE_CLIENT_EMAIL,
        client_id: SSMParamsService.Instance.firebaseParams.FIREBASE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/firebase'],
    };
  }

  async generateReferralDynamicLink(
    code: number,
    name: string,
    sourceName: string
  ) {
    return await new google.auth.GoogleAuth(this.options).request({
      method: 'POST',
      url: 'https://firebasedynamiclinks.googleapis.com/v1/managedShortLinks:create',
      data: {
        dynamicLinkInfo: {
          domainUriPrefix: `${
            process.env.WEBSITE_URL ?? 'https://wildr.com'
          }/invite`,
          link: `${
            process.env.WEBSITE_URL ?? 'https://wildr.com'
          }?referral=${code}&name=${name}`,
          androidInfo: {
            androidPackageName: process.env.APP_PACKAGE_NAME ?? 'com.wildr.app',
          },
          iosInfo: {
            iosAppStoreId: process.env.APP_STORE_ID ?? '1604130204',
            iosBundleId: process.env.APP_PACKAGE_NAME ?? 'com.wildr.app',
          },
          navigationInfo: {
            enableForcedRedirect: false,
          },
          analyticsInfo: {
            googlePlayAnalytics: {
              utmCampaign: sourceName + ' program',
              utmMedium: name,
              utmSource: sourceName,
            },
          },

          socialMetaTagInfo: {
            socialDescription:
              'Hey! I want to personally invite you to Wildr, the new toxicity-free social media app, through my special access link. See you there!',
            socialImageLink:
              'https://d1h8rem1j07piu.cloudfront.net/wildr_logo.png',
            socialTitle: 'Join me on Wildr! ✨',
          },
        },
        name: `${name} ${sourceName} Invite`,
        suffix: {
          customSuffix: name,
          option: 'CUSTOM',
        },
      },
    });
  }
}
