import 'package:auto_route/auto_route.dart';
import 'package:country_picker/country_picker.dart';
// ignore: implementation_imports
import 'package:country_picker/src/utils.dart' show Utils;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/input_decorations.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class LinkPhoneNumberPage extends StatefulWidget {
  const LinkPhoneNumberPage({super.key, this.unlink = false});
  final bool unlink;

  @override
  State<LinkPhoneNumberPage> createState() => _LinkPhoneNumberPageState();
}

void print(dynamic e) {
  debugPrint(e);
}

class _LinkPhoneNumberPageState extends State<LinkPhoneNumberPage> {
  final TextEditingController _otpEC = TextEditingController();
  final TextEditingController _phoneNumberEC = TextEditingController();
  Map<String, String> countryCode = {'phoneCode': '+1', 'countryCode': 'US'};
  late LoginGetController _loginGxC;
  late CurrentUserProfileGxC profileGxC = Get.find(tag: CURRENT_USER_TAG);
  late WildrUser user = profileGxC.user;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
    _loginGxC = Get.find();
  }

  @override
  void dispose() {
    _otpEC.dispose();
    _phoneNumberEC.dispose();
    _loginGxC.dispose();
    super.dispose();
  }

  Widget _profileImage() =>
      Center(child: ProfilePageCommon().profileImageCircleAvatar(user));

  Future<void> _handleOtp() async {
    final PhoneAuthCredential credential = PhoneAuthProvider.credential(
      verificationId: _loginGxC.otpVerificationId ?? '',
      smsCode: _otpEC.text,
    );
    try {
      if (widget.unlink) {
        await FirebaseAuth.instance.currentUser!.unlink('phone');
      } else {
        await FirebaseAuth.instance.currentUser!.linkWithCredential(credential);
      }
      if (!mounted) return;
      Navigator.pop(context);
      Navigator.pop(context);
    } catch (e) {
      debugPrint(e.toString());
      if (e is FirebaseAuthException) {
        debugPrint('OTP KA ERROR ${e.code} ${e.message}');
        Common().showErrorSnackBar(e.message.toString(), context);
        if (e.code == 'invalid-verification-code') {
          Common().showErrorSnackBar('Invalid OTP', context);
          return;
        }
      }
    }
  }

  void _pushVerificationPage() {
    context.pushRoute(
      VerificationPageRoute(
        isSignUp: false,
        onResendCode: verifyPhoneLogin,
        onBackPressed: () {},
        onChanged: (verificationCode) {
          _otpEC.text = verificationCode;
        },
        onComplete: (_) {
          debugPrint('ON COMPLETE');
          _handleOtp();
        },
        phoneNumber: _loginGxC.fullPhoneNumber,
      ),
    );
  }

  // ignore: avoid_positional_boolean_parameters
  void verifyPhoneLogin(bool callFromVerificationPage) {
    debugPrint('VERIFY CALLED $callFromVerificationPage');
    FirebaseAuth.instance.verifyPhoneNumber(
      timeout: const Duration(seconds: 60),
      phoneNumber: _loginGxC.fullPhoneNumber,
      verificationCompleted: (credential) async {
        debugPrint('Verification Completed!');
      },
      verificationFailed: (e) {
        debugPrint('Verification Failed! $e');
        if (e.code == 'invalid-phone-number') {
          Common().showErrorSnackBar(
            'The provided phone number is not valid.',
          );
        } else {
          Common().showErrorSnackBar(
            'The provided phone number is not valid.',
          );
        }
      },
      codeSent: (verificationId, resendToken) {
        debugPrint('Code has been sent $verificationId');
        if (resendToken == null) {
          Common().showErrorSnackBar(
            'Something went wrong, please try again later',
          );
          debugPrint('ResendToken is null');
          return;
        }
        _loginGxC..otpVerificationId = verificationId
        ..resendToken = resendToken
        ..startPhoneNumberTimer();
        if (!callFromVerificationPage) _pushVerificationPage();
      },
      codeAutoRetrievalTimeout: (verificationId) {
        _loginGxC..otpVerificationId = ''
        ..resendToken = 0;
        debugPrint('🔴🔴 Code auto retrieval timeout $verificationId');
        _loginGxC.isSubmitting = false;
      },
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: Common()
            .appbarWithActions(title: _appLocalizations.profile_linkEmail),
        body: Center(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(25),
                child: _profileImage(),
              ),
              const SizedBox(height: 25),
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      //width: 45,
                      height: 30,
                      margin: const EdgeInsets.only(top: 8, right: 8),
                      child: GestureDetector(
                        onTap: () {
                          showCountryPicker(
                            context: context,
                            showPhoneCode: true,
                            onSelect: (country) {
                              debugPrint(
                                'Select country:  ${country.phoneCode}',
                              );
                              setState(() {
                                countryCode['phoneCode'] =
                                    '+${country.phoneCode}';
                                countryCode['countryCode'] =
                                    country.countryCode;
                              });
                            },
                          );
                        },
                        child: Row(
                          children: [
                            Text(
                              Utils.countryCodeToEmoji(
                                countryCode['countryCode']!,
                              ),
                              style: const TextStyle(fontSize: 25),
                            ),
                            const SizedBox(width: 10),
                            Text(countryCode['phoneCode']!),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneNumberEC,
                        keyboardType: TextInputType.number,
                        keyboardAppearance: Theme.of(context).brightness,
                        decoration: InputDecorations.denseDecoration(
                          _appLocalizations.profile_phoneNumber,
                          errorText: _loginGxC.phNoEM.string,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all<Color>(
                    WildrColors.primaryColor,
                  ),
                  shape: MaterialStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(22.0),
                    ),
                  ),
                ),
                onPressed: () async {
                  _loginGxC.fullPhoneNumber =
                      countryCode['phoneCode']! + _phoneNumberEC.text;
                  try {
                    if (_loginGxC.otpVerificationId != '' ||
                        _loginGxC.resendToken != 0) {
                      _pushVerificationPage();
                    } else {
                      verifyPhoneLogin(false);
                    }
                  } catch (e) {
                    if (e is FirebaseAuthException) {
                      if (e.code == 'weak-password') {
                        Common().showSnackBar(
                          context,
                          _appLocalizations.profile_passwordTooWeak,
                        );
                      } else if (e.code == 'email-already-in-use') {
                        Common().showSnackBar(
                          context,
                          _appLocalizations.profile_emailAlreadyExists,
                        );
                      }
                    } else {
                      Common().showErrorSnackBar(kSomethingWentWrong);
                    }
                  }
                },
                child: Text(
                  _appLocalizations.profile_cap_link,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
