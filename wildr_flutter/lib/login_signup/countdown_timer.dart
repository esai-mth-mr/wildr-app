// ignore_for_file: avoid_positional_boolean_parameters, lines_longer_than_80_chars

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';

typedef BoolCallBack = Function(bool callFromVerificationPage);

class CountdownTimer extends StatefulWidget {
  const CountdownTimer({
    super.key,
    required this.timerValue,
    required this.onComplete,
    this.resendButtonClicked,
  });
  final RxInt timerValue;
  final BoolCallBack onComplete;
  final VoidCallback? resendButtonClicked;

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer>
    with TickerProviderStateMixin {
  late StreamSubscription stream;
  bool verifyButton = false;
  double size = 14;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
    stream = widget.timerValue.stream.listen((value) async {
      if (value >= kPhoneOTPTimeoutSecs) {
        widget.onComplete(true);
        verifyButton = true;
        if (!mounted) return;
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    stream.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Obx(
        () => Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: Center(
            child: verifyButton
                ? InkWell(
                    onTap: () {
                      verifyButton = false;
                      widget.onComplete(true);
                      if (widget.resendButtonClicked != null) {
                        widget.resendButtonClicked!.call();
                      }
                    },
                    child: Center(
                      child: Container(
                        alignment: Alignment.center,
                        child: Text(
                          _appLocalizations.login_signup_cap_resend,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: size,
                          ),
                        ),
                      ),
                    ),
                  )
                : Text(
                    'Resend(${kPhoneOTPTimeoutSecs - widget.timerValue.value}s)',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.light
                          ? Colors.black.withOpacity(0.5)
                          : Colors.white.withOpacity(0.5),
                    ),
                  ),
          ),
        ),
      );
}
