import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/login_signup/resend_email_buttons.dart';
import 'package:wildr_flutter/login_signup/widgets/refresh_email_verification_button.dart';
import 'package:wildr_flutter/widgets/buttons/big_button.dart';
import 'package:wildr_flutter/widgets/wildr_logo/logo.dart';

enum EmailVerificationType { SIGNUP, LINK }

class WaitForEmailVerificationPage extends StatelessWidget {
  final bool isSignUp;
  final bool showUnlink;
  final String email;
  final EmailVerificationType type;

  const WaitForEmailVerificationPage({
    super.key,
    required this.isSignUp,
    required this.showUnlink,
    required this.email,
    required this.type,
  });

  Future<bool?> _onPop(BuildContext context) async {
    switch (type) {
      case EmailVerificationType.SIGNUP:
        return isSignUp;
      case EmailVerificationType.LINK:
        if (WildrAuth().isEmailVerified()) {
          Common().showSnackBar(
            context,
            AppLocalizations.of(context)!.profile_unverified_linking_warning,
          );
        }
        return null;
    }
  }

  Column _getButtons(BuildContext context) {
    if (type == EmailVerificationType.LINK || showUnlink) {
      return Column(
        children: [
          const RefreshEmailVerificationButton.link(),
          const SizedBox(height: 10),
          ResendEmailButton(initLoginGxC: type == EmailVerificationType.LINK),
          const SizedBox(height: 10),
          BigButton.destructive(
            text: AppLocalizations.of(context)!.profile_cap_unlink,
            onPressed: () async {
              await context.popRoute();
            },
          ),
        ],
      );
    }
    return Column(
      children: [
        const RefreshEmailVerificationButton(),
        const SizedBox(height: 20),
        ResendEmailButton(initLoginGxC: type == EmailVerificationType.LINK),
      ],
    );
  }

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          await _onPop(context);
          return true;
        },
        child: BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            if (state is AuthenticationSuccessfulState) {
              context.popRoute();
            }
          },
          child: Scaffold(
            body: SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Logo(
                    popResult: isSignUp,
                    exitOnPressed: () async {
                      await _onPop(context);
                      await context.popRoute();
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      AppLocalizations.of(context)!
                          .login_signup_emailSentMessage,
                      style: const TextStyle(fontSize: 28),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    AppLocalizations.of(context)!
                        .login_signup_emailVerificationSentMessage,
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(email, style: const TextStyle(fontSize: 18)),
                  ),
                  Common().loadingLottieAnimation(),
                  const Spacer(),
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: _getButtons(context),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}
