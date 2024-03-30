import * as fs from 'fs';
import * as path from 'path';

interface AndroidConfig {
  bundleId: string;
  sha256CertFingerprints: string;
}

interface AppleConfig {
  teamId: string;
  bundleId: string;
  paths: string;
}

function generateAASA(): void {
  const androidTemplatePath = path.join(
    process.cwd(),
    'config/android-assetlinks.template.json'
  );

  const appleTemplatePath = path.join(
    process.cwd(),
    'config/apple-app-site-association.template.json'
  );

  const androidOutputPaths = [
    path.join(process.cwd(), 'public', 'assetlinks.json'),
    path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json'),
  ];

  const appleOutputPaths = [
    path.join(process.cwd(), 'public', 'apple-app-site-association'),
    path.join(
      process.cwd(),
      'public',
      '.well-known',
      'apple-app-site-association'
    ),
  ];

  let androidTemplate = fs.readFileSync(androidTemplatePath, 'utf8');
  let appleTemplate = fs.readFileSync(appleTemplatePath, 'utf8');

  // Environment-specific configurations
  const androidConfigs: Record<string, AndroidConfig> = {
    'wildr-dev': {
      bundleId: 'com.wildr.dev',
      sha256CertFingerprints:
        '["E0:CB:E2:26:66:D4:6C:C0:5A:4D:33:D9:2C:31:7F:84:BA:AD:82:4F:83:FC:39:1A:1C:EF:83:20:B1:A5:B3:07","F8:88:5F:F0:AF:3E:09:3B:D9:79:9E:A6:34:A5:6E:F8:AB:8F:51:EA:32:93:3F:A9:D9:3D:FA:1E:FC:7A:51:D4","90:FF:34:A3:CA:FF:14:08:F9:E0:98:E8:C7:79:AE:01:D2:C7:E9:0D:AF:56:16:EB:81:F2:86:B1:12:3B:21:E3","85:56:F3:2E:91:2B:21:D3:05:E8:41:AE:79:7D:25:D1:96:09:11:EB:15:04:7C:6F:70:07:97:88:DC:86:4E:D2","F9:A9:05:CC:8C:42:A3:3C:A8:88:E1:3C:A0:15:63:BB:B1:BC:93:5A:D0:09:F4:6C:B7:F2:0C:82:F6:06:25:7B","62:D7:84:D1:29:BE:B2:38:1E:78:77:01:2B:F8:CA:D7:FE:93:55:63:7C:B9:DB:FC:B8:8F:FB:65:89:8F:A1:26","E8:A3:6D:2B:8D:50:53:2E:3A:9C:E8:F5:49:A9:28:61:40:0C:15:7C:85:93:85:F2:5C:44:A2:D0:6C:5C:9B:E6","64:B8:DC:2A:B2:AA:5B:CE:70:B8:3C:97:DD:6B:AA:A0:22:B9:03:81:E8:0D:B7:41:D0:AC:57:C5:3E:6B:66:CC","0C:EF:BB:E0:C2:B9:17:7B:94:5B:6C:86:5B:C8:61:B0:B4:75:B8:45:53:8F:F3:9C:01:EA:18:D3:D8:F0:87:E9","64:CB:ED:C3:43:51:7D:DD:D3:B2:6E:AD:EC:AE:CA:38:44:9F:91:B5:71:F6:F2:FA:5D:70:29:3D:59:F8:83:71"]',
    },
    'wildr-prod': {
      bundleId: 'com.wildr.app',
      sha256CertFingerprints:
        '["F8:88:5F:F0:AF:3E:09:3B:D9:79:9E:A6:34:A5:6E:F8:AB:8F:51:EA:32:93:3F:A9:D9:3D:FA:1E:FC:7A:51:D4","90:FF:34:A3:CA:FF:14:08:F9:E0:98:E8:C7:79:AE:01:D2:C7:E9:0D:AF:56:16:EB:81:F2:86:B1:12:3B:21:E3","AA:13:67:AF:F5:72:6C:96:DF:62:28:C8:6A:30:5C:02:4C:B0:E1:F1:20:04:E9:C2:00:72:A3:9D:6C:7D:86:2B","E0:CB:E2:26:66:D4:6C:C0:5A:4D:33:D9:2C:31:7F:84:BA:AD:82:4F:83:FC:39:1A:1C:EF:83:20:B1:A5:B3:07"]',
    },
  };

  const appleConfigs: Record<string, AppleConfig> = {
    'wildr-dev': {
      teamId: 'A4336N74HY',
      bundleId: 'com.wildr.dev',
      paths: '["/share/*", "/challenges/*", "/invite/*"]',
    },
    'wildr-prod': {
      teamId: 'A4336N74HY',
      bundleId: 'com.wildr.app',
      paths: '["/post/*", "/challenges/*", "/invite/*"]',
    },
  };

  const androidConfig = androidConfigs[process.env.ENVIRONMENT ?? ''];
  if (!androidConfig) {
    throw new Error(
      'Unable to find android config for environment ${environment}'
    );
  }

  const appleConfig = appleConfigs[process.env.ENVIRONMENT ?? ''];
  if (!appleConfig) {
    throw new Error(
      'Unable to find apple config for environment ${environment}'
    );
  }

  // Replace placeholders
  androidTemplate = androidTemplate
    .replace('BUNDLEID_PLACEHOLDER', androidConfig.bundleId)
    .replace(
      'SHA256_CERT_FINGERPRINTS_PLACEHOLDER',
      androidConfig.sha256CertFingerprints
    );

  appleTemplate = appleTemplate
    .replace('TEAMID_PLACEHOLDER', appleConfig.teamId)
    .replace('BUNDLEID_PLACEHOLDER', appleConfig.bundleId)
    .replace('PATHS_PLACEHOLDER', appleConfig.paths);

  androidOutputPaths.forEach(path => fs.writeFileSync(path, androidTemplate));
  appleOutputPaths.forEach(path => fs.writeFileSync(path, appleTemplate));
}

generateAASA();
