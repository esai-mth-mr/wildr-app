
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/main_common.dart';

class TestConfigureFlavor {
  static Future<void> configureFlavor() async {
    dotenv.testLoad();
    const env = Environment.LOCAL;

    FlavorConfig(
      flavorName: env.getFlavourName(),
      values: {
        kEnvironment: env.name,
        kServerUrl: env.getUrl(),
        kDynamicLinkUrlPrefix: env.getDynamicLinkUrlPrefix(),
        kDynamicLinkUrl: env.getDynamicLinkUrl(),
        kDynamicLinkFirstSharePostPathSegment:
            env.getDynamicLinkFirstSharePostPathSegment(),
        kPackageName: env.getPackageName(),
        kAppStoreId: '1604130204',
        kBaseWebsiteUrl: env.getBaseWebsiteUrl(),
        kCanPrintLogs: true,
      },
    );
  }
}
