import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/login_signup/countdown_timer.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';
import 'package:wildr_flutter/widgets/buttons/big_button.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ResendEmailButton extends StatefulWidget {
  final bool initLoginGxC;

  const ResendEmailButton({
    super.key,
    this.initLoginGxC = false,
  });

  @override
  State<ResendEmailButton> createState() => _ResendEmailButtonState();
}

class _ResendEmailButtonState extends State<ResendEmailButton> {
  late LoginGetController _loginGxC;
  late bool _canSendEmail;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _loginGxC =
        widget.initLoginGxC ? Get.put(LoginGetController()) : Get.find();
    if (widget.initLoginGxC) {
      _sendEmail();
    }
    _canSendEmail = !_loginGxC.didSendEmailVerification;
    super.initState();
  }

  void _sendEmail() {
    try {
      setState(() => _canSendEmail = false);
      _loginGxC.startEmailVerificationTimer();
      Common().mainBloc(context).add(RequestVerificationEmailEvent());
      debugPrint('Email Sent');
    } catch (e) {
      context.loaderOverlay.hide();
      debugPrint(e.toString());
      Common().showErrorSnackBar(kSomethingWentWrong, context);
    }
  }

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 50,
        child: BigButton.child(
          color: WildrColors.secondaryColor,
          textColor: WildrColors.primaryColor,
          onPressed: !_canSendEmail ? null : () => _sendEmail(),
          child: _canSendEmail
              ? Text(
                  _appLocalizations.login_signup_resendEmail,
                  style: const TextStyle(
                    color: WildrColors.primaryColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                  ),
                )
              : CountdownTimer(
                  timerValue: _loginGxC.emailVerificationTimerValue,
                  onComplete: (_) {
                    _loginGxC.cancelEmailVerificationTimer();
                    setState(() => _canSendEmail = true);
                  },
                ),
        ),
      );
}
