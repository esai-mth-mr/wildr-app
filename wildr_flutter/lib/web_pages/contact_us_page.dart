import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/web_pages/web_view_page.dart';

class ContactUsPage extends StatelessWidget {
  const ContactUsPage({super.key});

  @override
  Widget build(BuildContext context) => WebViewPage(
        title: AppLocalizations.of(context)!.profile_contactUs,
        url: FlavorConfig.getValue(kBaseWebsiteUrl) + '/contact',
      );
}
