import * as Firebase from 'firebase-admin';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { replace } from 'lodash';
import { SSMParamsService } from '../ssm-params/ssm-params.service';

@Injectable()
export class FirebaseService {
  public app: Firebase.app.App;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'FCMFirebaseAdminService' });
    const firebaseParams = {
      type: SSMParamsService.Instance.firebaseParams.FIREBASE_TYPE,
      projectId: SSMParamsService.Instance.firebaseParams.FIREBASE_PROJECT_ID,
      privateKeyId:
        SSMParamsService.Instance.firebaseParams.FIREBASE_PRIVATE_KEY_ID,
      privateKey: replace(
        SSMParamsService.Instance.firebaseParams.FIREBASE_PRIVATE_KEY ?? '',
        /\\n/g,
        '\n'
      ),
      clientEmail:
        SSMParamsService.Instance.firebaseParams.FIREBASE_CLIENT_EMAIL,
      clientId: SSMParamsService.Instance.firebaseParams.FIREBASE_CLIENT_ID,
      authUri: SSMParamsService.Instance.firebaseParams.FIREBASE_AUTH_URI,
      tokenUri: SSMParamsService.Instance.firebaseParams.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl:
        SSMParamsService.Instance.firebaseParams
          .FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      clientC509CertUrl:
        SSMParamsService.Instance.firebaseParams.FIREBASE_CLIENTX509_CERT_URL,
    };
    if (Firebase.apps.length) {
      this.app = Firebase.app();
    } else {
      this.app = Firebase.initializeApp({
        credential: Firebase.credential.cert(firebaseParams),
      });
    }
  }
}
