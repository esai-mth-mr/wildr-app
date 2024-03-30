import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/widgets/wildr_logo/logo.dart';

class LogoHeader extends StatelessWidget {
  const LogoHeader({super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(
          left: 40,
          right: 40,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Logo(shouldShowBackButton: false),
            Text(
              AppLocalizations.of(context)!.comm_title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 42,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              AppLocalizations.of(context)!
                  .onboarding_toxicityFreeSocialNetworkDescription,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
}
