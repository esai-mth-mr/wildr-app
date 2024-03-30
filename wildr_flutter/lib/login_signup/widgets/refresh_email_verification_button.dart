import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/auth/wildr_fcm_token_provider.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

enum EmailVerificationType { SIGNUP, LINK }

class RefreshEmailVerificationButton extends StatefulWidget {
  final EmailVerificationType type;

  const RefreshEmailVerificationButton({
    super.key,
  }) : type = EmailVerificationType.SIGNUP;

  const RefreshEmailVerificationButton.link({
    super.key,
  }) : type = EmailVerificationType.LINK;

  @override
  State<RefreshEmailVerificationButton> createState() =>
      _RefreshEmailVerificationButtonState();
}

class _RefreshEmailVerificationButtonState
    extends State<RefreshEmailVerificationButton> {
  bool _loginRequestSent = false;
  late final bool _shouldRequestSever;
  bool _isChecking = false;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _shouldRequestSever =
        Platform.isAndroid && widget.type == EmailVerificationType.LINK;
    _loginRequestSent = false;
    super.initState();
    if (!_shouldRequestSever) {
      // _checkVerification();
    }
  }

  Future<void> _checkVerification() async {
    print('_checkVerification...');
    setState(() {
      _isChecking = true;
    });
    if (_shouldRequestSever) {
      print('_requestServerToCheckVerification');
      await _requestServerToCheckVerification();
      return;
    }
    final User? user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      print('User == null');
      Common().showErrorSnackBar(kSomethingWentWrong, context);
      setState(() {
        _isChecking = false;
      });
      return;
    }
    await user.reload();
    //Delay required because Firebase takes time to reflect the
    // status when the user taps on the verify email button from the email
    await Common().delayInPlace(2000);
    await user.reload();
    if (widget.type == EmailVerificationType.SIGNUP) {
      if (user.emailVerified && !_loginRequestSent) {
        print('Firing firebase event');
        Common().mainBloc(context).add(
              FirebaseEmailAuthEvent(
                email: user.email!,
                token: (await WildrAuth().getToken(
                  forceRefresh: true,
                  caller: '_checkVerification',
                ))!,
                uid: user.uid,
                fcmToken: await WildrFcmTokenProvider().getFcmToken(),
              ),
            );
        setState(() => _loginRequestSent = true);
        return;
      }
      Common().showSnackBar(
        context,
        _appLocalizations.login_signup_tryAgainInFewSecondsMessage,
      );
      setState(() {
        _isChecking = false;
      });
    } else {
      if (user.emailVerified) {
        _onEmailVerified();
      }
    }
  }

  void _onEmailVerified() {
    print('_onEmailVerified---');
    context.popRoute();
    if (widget.type == EmailVerificationType.LINK) {
      print('type == link');
      context.popRoute();
      WildrAuth().getToken(
        forceRefresh: true,
        caller: '_onEmailVerified',
      );
    }
  }

  Future<void> _requestServerToCheckVerification() async {
    Common().mainBloc(context).add(IsEmailVerifiedEvent());
  }

  Widget _listener(Widget child) => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is IsEmailVerifiedState) {
            if (state.isSuccessful) {
              if (state.isEmailVerified) {
                _onEmailVerified();
              }
            } else {
              setState(() {
                _isChecking = false;
              });
              Common().showErrorSnackBar(
                state.errorMessage ?? kSomethingWentWrong,
                context,
              );
            }
          }
        },
        child: child,
      );

  Widget _button() => SizedBox(
        height: 50,
        child: FGBGNotifier(
          onEvent: (type) {
            if (type == FGBGType.foreground) {
              print('In foreground');
              _checkVerification();
            }
          },
          child: _isChecking
              ? const CupertinoActivityIndicator(radius: 15)
              : PrimaryCta(
                  text: _appLocalizations.login_signup_cap_refresh,
                  onPressed: _checkVerification,
                  filled: true,
                ),
        ),
      );

  @override
  Widget build(BuildContext context) =>
      _shouldRequestSever ? _listener(_button()) : _button();

  @override
  void dispose() {
    super.dispose();
  }
}

void print(dynamic message) {
  debugPrint('[RefreshEmailVerificationButton]: $message');
}
