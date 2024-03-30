import { getSignedUrl } from '@aws-sdk/cloudfront-signer'; // ESM
import { SSMParamsService } from '../ssm-params/ssm-params.service';

export class CDNPvtUrlSigner {
  cloudfrontDistributionDomain: string;
  s3ObjectKey: string;
  url: string;
  privateKey: string;
  keyPairId: string;
  dateLessThan: string;

  constructor() {
    this.cloudfrontDistributionDomain =
      'https://' + SSMParamsService.Instance.s3Params.AWS_CF_PVT_S3_DOMAIN!;
    this.privateKey = SSMParamsService.Instance.s3Params.AWS_CF_PVT_KEY!;
    this.keyPairId = SSMParamsService.Instance.s3Params.AWS_CF_PVT_KEY_ID!;
  }

  async getSignedUrl(object: string): Promise<string> {
    return getSignedUrl({
      url: `${this.cloudfrontDistributionDomain}/${object}`,
      keyPairId: this.keyPairId,
      dateLessThan: new Date(
        new Date().getTime() + 24 * 60 * 60 * 1000
      ).toISOString(),
      privateKey: this.privateKey,
    });
  }
}

// signedUrl = getSignedUrl({
//   url,
//   keyPairId,
//   dateLessThan,
//   privateKey,
// });
