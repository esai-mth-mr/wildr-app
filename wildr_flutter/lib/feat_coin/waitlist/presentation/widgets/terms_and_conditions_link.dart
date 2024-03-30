import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class TermsAndConditionsTextButton extends StatelessWidget {
  const TermsAndConditionsTextButton({
    super.key,
    this.text,
  });
  final String? text;

  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: () {
          context.pushRoute(const TermsOfServicePageRoute());
        },
        child: Text(
          AppLocalizations.of(context)!.wildrcoin_dashboard_t_and_c_apply_text,
          style: const TextStyle(
            fontSize: 12,
            color: WildrColors.gray500,
            decoration: TextDecoration.underline,
          ),
        ),
      );
}
