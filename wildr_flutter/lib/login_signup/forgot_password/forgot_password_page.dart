import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  TextEditingController emailController = TextEditingController();
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Future<void> _passwordResetLinkPressed() async {
    context.loaderOverlay.show();
    try {
      if (RegExp(r'^.+@[a-zA-Z]+\.[a-zA-Z]+(\.?[a-zA-Z]+)$')
          .hasMatch(emailController.text)) {
        await FirebaseAuth.instance.sendPasswordResetEmail(
          email: emailController.text,
        );
        await SystemChannels.textInput.invokeMethod('TextInput.hide');
        context.loaderOverlay.hide();
        await context.router.push(
          const PasswordResetLinkSentPageRoute(),
        );
      } else {
        context.loaderOverlay.hide();
        Common().showSnackBar(
          context,
          _appLocalizations.login_signup_invalidEmailAddressErrorMessage,
        );
      }
    } on FirebaseException catch (e) {
      context.loaderOverlay.hide();
      if (e.code == 'user-not-found') {
        Common().showErrorSnackBar(
          _appLocalizations.login_signup_accountNotFoundSignupMessage,
          context,
        );
      }
    }
  }

  Widget _emailField() => TextFormField(
        controller: emailController,
        decoration: InputDecoration(
          hintText: _appLocalizations.profile_cap_email,
          border: const OutlineInputBorder(),
        ),
        validator: (value) =>
            value != null && value.isNotEmpty ? null : 'Required',
      );

  void _dismissKeyboard(BuildContext context) {
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () {
          _dismissKeyboard(context);
        },
        child: Scaffold(
          appBar: AppBar(),
          body: Padding(
            padding: EdgeInsets.only(
              left: Get.width * 0.04,
              right: Get.width * 0.04,
              bottom: Get.height * 0.01,
              top: Get.height * 0.04,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _body(),
            ),
          ),
        ),
      );

  List<Widget> _body() => [
        TitleText(title: _appLocalizations.login_signup_forgotPassword),
        SizedBox(height: 5.0.h),
        SubTitle(
          subTitle:
              _appLocalizations.login_signup_enterEmailToFindAccountPrompt,
        ),
        SizedBox(height: Get.height * 0.03),
        Text(
          _appLocalizations.profile_cap_email,
          style: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
            color: WildrColors.lightDarkTextModeColor(context),
          ),
        ),
        SizedBox(height: Get.height * 0.01),
        _emailField(),
        SizedBox(height: Get.height * 0.05),
        SizedBox(
          height: 40.0.h,
          width: double.infinity,
          child: PrimaryCta(
            text: _appLocalizations.login_signup_sendPasswordResetLinkButton,
            onPressed: _passwordResetLinkPressed,
            filled: true,
          ),
        ),
        SizedBox(height: Get.height * 0.03),
        GestureDetector(
          onTap: () {
            context.router.push(const MoreHelpPageRoute());
          },
          child:
              SubTitle(subTitle: _appLocalizations.login_signup_needMoreHelp),
        ),
      ];
}

class TitleText extends StatelessWidget {
  final String title;

  const TitleText({super.key, required this.title});

  @override
  Widget build(BuildContext context) => Center(
        child: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 28,
            color: WildrColors.lightDarkTextModeColor(context),
          ),
        ),
      );
}

class SubTitle extends StatelessWidget {
  final String subTitle;

  const SubTitle({super.key, required this.subTitle});

  @override
  Widget build(BuildContext context) => Center(
        child: Text(
          subTitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
            fontFamily: FontFamily.satoshi,
            color: WildrColors.wildrVerifySubTextColor(context: context),
          ),
        ),
      );
}
