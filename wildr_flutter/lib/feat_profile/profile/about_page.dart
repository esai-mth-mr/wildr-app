import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/build_number.dart';
import 'package:wildr_flutter/routes.gr.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  Widget _divider() => Divider(
        color: Colors.grey[600],
        endIndent: 20,
        indent: 20,
      );

  Widget _tile(String text, Function onPressed, BuildContext context) => Column(
        children: [
          ListTile(
            dense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            title: Text(
              text,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w500,
              ),
            ),
            trailing: const SizedBox(
              width: 35,
              height: 35,
              child: Center(
                child: WildrIcon(
                  WildrIcons.chevron_right_filled,
                ),
              ),
            ),
            onTap: () {
              onPressed();
            },
          ),
          _divider(),
        ],
      );

  @override
  Widget build(BuildContext context) {
    const List<Map<String, String>> disclosures = [
      {
        'title': 'Terms of Service',
        'flutterPath': '/terms-of-service-page',
      },
      {
        'title': 'Privacy Policy',
        'flutterPath': '/privacy-policy-page',
      },
      {
        'title': 'Community Guidelines',
        'flutterPath': '/community-guidelines-page',
      },
      // {
      //   "title": "Intellectual Property Policy",
      //   "uri": "/legal/intellectual-property-policy?mobile=true",
      // },
    ];

    return Scaffold(
      appBar: Common().appbarWithActions(
        title: AppLocalizations.of(context)!.profile_cap_about,
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            Column(
              children: disclosures
                  .map(
                    (disclosureItem) => _tile(
                      disclosureItem['title']!,
                      () {
                        context.router.pushNamed(
                          disclosureItem['flutterPath']!,
                        );
                      },
                      context,
                    ),
                  )
                  .toList(),
            ),
            _tile(
              AppLocalizations.of(context)!.profile_cap_licenses,
              () => context.pushRoute(
                LicensePageRoute(applicationName: 'Wildr'),
              ),
              context,
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: BuildNumber(),
            ),
          ],
        ),
      ),
    );
  }
}
