import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';
import 'package:wildr_flutter/web_pages/web_view_page.dart';

class CommunityGuidelinesPage extends StatelessWidget {
  final String? reportLink;

  const CommunityGuidelinesPage({super.key, this.reportLink});

  @override
  Widget build(BuildContext context) => WebViewPage(
        title: AppLocalizations.of(context)!.web_pages_communityGuidelines,
        url: reportLink ??
            FlavorConfig.getValue(kBaseWebsiteUrl) +
                FDLConstants.communityGuidelineSuffix,
      );
}
