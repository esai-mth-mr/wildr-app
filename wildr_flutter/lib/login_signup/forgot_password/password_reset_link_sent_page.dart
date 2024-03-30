import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/login_signup/forgot_password/forgot_password_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class PasswordResetLinkSentPage extends StatelessWidget {
  const PasswordResetLinkSentPage({super.key});

  void _onGoBackSignInTap(BuildContext context) {
    context.router.popUntilRouteWithName(LoginEmailOrPhonePageRoute.name);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: _body(context),
          ),
        ),
      );

  List<Widget> _body(BuildContext context) => [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12.0),
                child: Center(
                  child: WildrIconPng(
                    WildrIconsPng.paperPlane,
                  ),
                ),
              ),
              SizedBox(height: 4.0.h),
              TitleText(
                title: AppLocalizations.of(context)!
                    .login_signup_passwordResetLinkSentMessage,
              ),
              SizedBox(height: Get.height * 0.03),
              SubTitle(
                subTitle: AppLocalizations.of(context)!
                    .login_signup_checkEmailInstructionsMessage,
              ),
            ],
          ),
        ),
        SizedBox(
          height: 40.0.h,
          width: double.infinity,
          child: PrimaryCta(
            text: AppLocalizations.of(context)!.login_signup_goBackToSignIn,
            onPressed: () {
              _onGoBackSignInTap(context);
            },
            filled: true,
          ),
        ),
      ];
}
