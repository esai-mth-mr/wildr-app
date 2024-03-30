import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/svg.dart';
import 'package:wildr_flutter/dialogs/confirmation_dialog.dart';

class EmailVerificationDialogBox extends StatelessWidget {
  const EmailVerificationDialogBox({super.key});

  @override
  Widget build(BuildContext context) => CustomDialogBox(
        logo: Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 10),
          child: SvgPicture.asset('assets/icon/email.svg'),
        ),
        title: AppLocalizations.of(context)!
            .login_signup_emailVerificationRequired,
        description: AppLocalizations.of(context)!
            .login_signup_verificationEmailSentMessage,
        descriptionColor: Colors.grey,
        centerButtonText: AppLocalizations.of(context)!.comm_cap_okay,
        centerButtonOnPressed: () => Navigator.pop(context),
      );
}
