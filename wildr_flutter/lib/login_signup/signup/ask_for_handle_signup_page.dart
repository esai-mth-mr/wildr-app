import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:debounce_throttle/debounce_throttle.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/auth/wildr_fcm_token_provider.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_state.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/signup/sign_up_details.dart';
import 'package:wildr_flutter/login_signup/signup/signup_gxc.dart';
import 'package:wildr_flutter/login_signup/signup/signup_signup_after_handle_details.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AskForHandleAndSignUpPage extends StatefulWidget {
  final SignupAfterHandleDetails signUpDetails;

  const AskForHandleAndSignUpPage({
    super.key,
    required this.signUpDetails,
  });

  @override
  State<AskForHandleAndSignUpPage> createState() =>
      AskForHandleAndSignUpPageState();
}

void print(dynamic message) {
  debugPrint('[SignupPage3rdParty] $message');
}

class AskForHandleAndSignUpPageState extends State<AskForHandleAndSignUpPage> {
  late SignupGxC _signupGxC;
  late final TextEditingController _nameEC;
  late final TextEditingController _handleEC;
  final _debouncer =
      Debouncer<String>(const Duration(milliseconds: 500), initialValue: '');
  bool _isCheckingForHandle = false;
  late double bottomPadding = MediaQuery.of(context).padding.bottom;
  File? _profileImage;
  late final _mainBloc = Common().mainBloc(context);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final int maxCharacterLimit = 20;
  final int maxNameCharacterLimit = 200;

  @override
  void initState() {
    Get.put(SignupGxC());
    _signupGxC = Get.find();
    if (widget.signUpDetails.name != null) {
      _nameEC = TextEditingController(text: widget.signUpDetails.name);
    } else {
      _nameEC = TextEditingController();
    }

    _nameEC.addListener(_updateHandle);

    _handleEC = TextEditingController();
    _handleEC.addListener(
      () => _debouncer.value = _handleEC.text,
    );
    _debouncer.values.listen((handle) => _checkHandle(handle));
    super.initState();
  }

  void _updateHandle() {
    final handleWithUnderscores = _filterHandle(_nameEC.text);

    if (handleWithUnderscores.length <= maxCharacterLimit) {
      _handleEC.text = handleWithUnderscores.toLowerCase();
    } else {
      _handleEC.text =
          handleWithUnderscores.substring(0, maxCharacterLimit).toLowerCase();
    }
  }

  String _filterHandle(String input) {
    final filteredHandle = input.replaceAll(RegExp(r'[^A-Za-z0-9 ]'), '');
    return filteredHandle.replaceAll(' ', '_');
  }

  @override
  void dispose() {
    _nameEC.dispose();
    _handleEC.dispose();
    super.dispose();
  }

  Future<void> _checkHandle(String handle) async {
    setState(() {
      _isCheckingForHandle = true;
    });
    _mainBloc.add(CheckHandleEvent(handle));
  }

  Widget _nameAndUsername() => Obx(
        () => Wrap(
          runSpacing: 10.0.h,
          children: [
            Row(
              children: [
                Text(_appLocalizations.setupProfile_cap_name),
                const SizedBox(width: 10),
                Text(
                  _appLocalizations.setupProfile_firstAndLastName,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
            TextField(
              decoration: const InputDecoration(
                counterText: '',
                border: OutlineInputBorder(),
              ),
              autocorrect: false,
              textCapitalization: TextCapitalization.words,
              controller: _nameEC,
              maxLength: maxNameCharacterLimit,
              onChanged: (value) {
                if (_signupGxC.nameEM.value.isEmpty) return;
                _signupGxC.nameEM.value = '';
              },
              textInputAction: TextInputAction.next,
              style: TextStyle(color: WildrColors.textColor(context)),
            ),
            Text(
              'Handle${_isCheckingForHandle ? ' (checking...)' : ''}',
              style: ChallengesStyles.of(context).textFieldHeaderTextStyle,
            ),
            TextField(
              decoration: InputDecoration(
                counterText: '',
                border: const OutlineInputBorder(),
                errorText: _signupGxC.usernameEM.value.isNotEmpty
                    ? _signupGxC.usernameEM.value
                    : null,
              ),
              maxLength: maxCharacterLimit,
              autocorrect: false,
              controller: _handleEC,
              style: TextStyle(color: WildrColors.textColor(context)),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp('[A-Za-z0-9_]')),
                LowerCaseTextFormatter(),
              ],
              onChanged: (_) {
                _signupGxC.canProceed.value = false;
              },
              textInputAction: TextInputAction.done,
            ),
          ],
        ),
      );

  Future<void> _performSignup() async {
    if (_nameEC.text.isEmpty) {
      Common().showSnackBar(context, 'Please enter your Name');
      return;
    }
    if (_handleEC.text.isEmpty) {
      Common().showSnackBar(context, 'Please enter your Handle');
      return;
    }
    context.loaderOverlay.show();
    final String? referralChallengeId =
        Prefs.getString(PrefKeys.kChallengeIdForSignupReferralParams);
    final int? referralCode = Prefs.getInt(PrefKeys.kReferralOrInviteCode);
    final String? referralHandle = Prefs.getString(PrefKeys.kReferrerHandle);
    final String? referralId = Prefs.getString(PrefKeys.kReferrerId);
    final String? referralSource = Prefs.getString(PrefKeys.kFDLSource);

    if (widget.signUpDetails.loginType == LoginType.APPLE ||
        widget.signUpDetails.loginType == LoginType.GOOGLE) {
      final User? firebaseCurrentUser = FirebaseAuth.instance.currentUser;
      final token = await WildrAuth().getToken(
        caller: '_performSignup()#THIRD_PARTY',
        forceRefresh: true,
      );
      if (token == null) {
        print('3rd part token == null');
        context.loaderOverlay.hide();
        Common().showSomethingWentWrong(context);
        return;
      }
      if (firebaseCurrentUser != null) {
        await FirebaseAnalytics.instance.setUserId(id: firebaseCurrentUser.uid);
        _mainBloc.add(
          FirebaseSignupEvent(
            SignupDetails(
              email: firebaseCurrentUser.email,
              name: _nameEC.text,
              handle: _handleEC.text,
              language: '',
              token: token,
              uid: firebaseCurrentUser.uid,
              gender: widget.signUpDetails.pronoun?.toGenderString() ??
                  'NOT_SPECIFIED',
              profileImage: _profileImage,
              birthday: widget.signUpDetails.birthday,
              categories: widget.signUpDetails.categories,
            ),
            Prefs.getInt(PrefKeys.kReferralOrInviteCode),
            Prefs.getString(PrefKeys.kReferralName),
            fcmToken: await WildrFcmTokenProvider().getFcmToken(),
            referralChallengeId: referralChallengeId,
            referralCode: referralCode,
            referrerHandle: referralHandle,
            referrerId: referralId,
            referralSource: referralSource,
          ),
        );
        return;
      }
    } else if (widget.signUpDetails.loginType == LoginType.PHONE) {
      final User? firebaseCurrentUser = FirebaseAuth.instance.currentUser;
      if (firebaseCurrentUser == null) {
        print('PhoneLogin: Firebase current user == null');
        _mainBloc.logCustomEvent(
          DebugPhoneLoginAnalyticsEvents.kPerformSignupFirebaseCurrentUserNull,
        );
        return;
      }
      await FirebaseAnalytics.instance.setUserId(id: firebaseCurrentUser.uid);
      final token = await WildrAuth()
          .getToken(forceRefresh: true, caller: '_performSignup#PHONE');
      if (token == null) {
        print('3rd part token == null');
        context.loaderOverlay.hide();
        Common().showSomethingWentWrong(context);
        return;
      }
      _mainBloc.add(
        FirebaseSignupEvent(
          SignupDetails(
            phoneNumber: firebaseCurrentUser.phoneNumber,
            name: _nameEC.text,
            handle: _handleEC.text,
            language: '',
            token: token,
            uid: firebaseCurrentUser.uid,
            gender: widget.signUpDetails.pronoun?.toGenderString() ??
                'NOT_SPECIFIED',
            profileImage: _profileImage,
            birthday: widget.signUpDetails.birthday,
            categories: widget.signUpDetails.categories,
          ),
          Prefs.getInt(PrefKeys.kReferralOrInviteCode),
          Prefs.getString(PrefKeys.kReferralName), //creator's name
          fcmToken: await WildrFcmTokenProvider().getFcmToken(),
          referralChallengeId: referralChallengeId,
          referralCode: referralCode,
          referrerHandle: referralHandle,
          referrerId: referralId,
          referralSource: referralSource,
        ),
      );
      return;
    } else if (widget.signUpDetails.loginType == LoginType.EMAIL) {
      final EmailFBAuthProvider emailAuthProvider = EmailFBAuthProvider(
        email: widget.signUpDetails.credentials['email']!,
        password: widget.signUpDetails.credentials['password']!,
      );
      try {
        final UserCredential emailCredentials = await FirebaseAuth.instance
            .signInWithCredential(emailAuthProvider.getCredential());
        final signUpDetails = SignupDetails(
          email: widget.signUpDetails.credentials['email']!,
          name: _nameEC.text,
          handle: _handleEC.text,
          language: '',
          token: await emailCredentials.user?.getIdToken(true),
          uid: emailCredentials.user?.uid,
          gender:
              widget.signUpDetails.pronoun?.toGenderString() ?? 'NOT_SPECIFIED',
          profileImage: _profileImage,
          birthday: widget.signUpDetails.birthday,
          categories: widget.signUpDetails.categories,
        );
        await FirebaseAnalytics.instance
            .setUserId(id: emailCredentials.user?.uid);
        _mainBloc.add(
          FirebaseSignupEvent(
            signUpDetails,
            Prefs.getInt(PrefKeys.kReferralOrInviteCode),
            Prefs.getString(PrefKeys.kReferralName),
            fcmToken: await WildrFcmTokenProvider().getFcmToken(),
            referralChallengeId: referralChallengeId,
            referralCode: referralCode,
            referrerHandle: referralHandle,
            referrerId: referralId,
            referralSource: referralSource,
          ),
        );
        return;
      } catch (e) {
        context.loaderOverlay.hide();
        debugPrint(e.toString());
      }
    }
    context.loaderOverlay.hide();
    Common().showErrorSnackBar(kSomethingWentWrong, context);
  }

  Widget _continueButton() => Obx(
        () => Opacity(
          opacity: _signupGxC.canProceed.value ? 1 : .5,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 12,
              vertical: Common().getBottomPadding(bottomPadding),
            ),
            child: PrimaryCta(
              text: _appLocalizations.login_signup_cap_continue,
              onPressed: _signupGxC.canProceed.value ? _performSignup : null,
              fillWidth: true,
              filled: true,
            ),
          ),
        ),
      );

  void _mainBlocListener(_, state) {
    if (state is HandleAlreadyTakenState) {
      _signupGxC.usernameEM.value = state.message;
      setState(() {});
      context.loaderOverlay.hide();
    } else if (state is CheckHandleResultState) {
      setState(() {
        _isCheckingForHandle = false;
      });
      debugPrint(
        'CheckForHandle result = ${state.errorMessage} and ${state.doesExist}',
      );
      if (state.doesExist) {
        _signupGxC.usernameEM.value =
            _appLocalizations.login_signup_userAlreadyExists;
        _signupGxC.canProceed.value = false;
      } else if (_handleEC.text.length < 5) {
        _signupGxC.canProceed.value = false;
        _signupGxC.usernameEM.value =
            _appLocalizations.login_signup_usernameMinimumLengthErrorMessage;
      } else {
        _signupGxC.usernameEM.value = '';
        _signupGxC.canProceed.value = true;
      }
    } else if (state is LoginSignupFailedState) {
      context.loaderOverlay.hide();
      Common().showSnackBar(context, state.message);
    }
  }

  Widget get _uploadPhotoButton => GestureDetector(
        onTap: _onUploadPhotoButtonPressed,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (_profileImage == null)
              CircleAvatar(
                backgroundColor: WildrColors.emerald800,
                radius: 48,
                child: Text(
                  _appLocalizations.comm_cap_upload,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: WildrColors.white,
                  ),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    width: 3,
                    color: WildrColors.emerald800,
                  ),
                ),
                child: CircleAvatar(
                  backgroundColor: WildrColors.emerald800,
                  foregroundImage: FileImage(_profileImage!),
                  radius: 48,
                ),
              ),
            const Positioned.fill(
              child: Align(
                alignment: Alignment.bottomRight,
                child: DecoratedBox(
                  decoration: ShapeDecoration(
                    color: WildrColors.gray100,
                    shape: CircleBorder(),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(6),
                    child: WildrIcon(
                      WildrIcons.pencil_outline,
                      size: 14,
                      color: WildrColors.gray1200,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );

  void _onUploadPhotoButtonPressed() async {
    await SystemChannels.textInput.invokeMethod('TextInput.hide');
    await Common().showActionSheet(
      context,
      [
        GestureDetector(
          onTap: _openCamera,
          child: Container(
            height: 35.0.h,
            width: double.infinity,
            color: Colors.transparent,
            child: Center(
              child: Text(
                _appLocalizations.comm_cap_camera,
                textAlign: TextAlign.center,
                style: Common().actionSheetTextStyle(),
              ),
            ),
          ),
        ),
        Common().actionSheetDivider(),
        GestureDetector(
          onTap: () {
            Navigator.of(context).pop(); // Pop the action sheet
            Common()
                .pickProfileImageAndCrop(context, ImageSource.gallery)
                .then((file) {
              if (file == null) return;
              setState(() {
                _profileImage = file;
              });
            });
          },
          child: Container(
            height: 35.0.h,
            width: double.infinity,
            color: Colors.transparent,
            child: Center(
              child: Text(
                _appLocalizations.comm_cap_photos,
                textAlign: TextAlign.center,
                style: Common().actionSheetTextStyle(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openCamera() async {
    Navigator.of(context).pop(); // Pop the action sheet
    await context.pushRoute(
      UploadProfilePhotoPageRoute(
        onProfilePhotoSaved: (file) {
          setState(() {
            _profileImage = file;
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) => ChallengesTheme(
        child: WillPopScope(
          onWillPop: () {
            Navigator.of(context).pop(true);
            return Future.value(false);
          },
          child: Scaffold(
            appBar: AppBar(
              elevation: 0,
              shadowColor: Colors.transparent,
              backgroundColor: Colors.transparent,
              systemOverlayStyle: SystemUiOverlayStyle.dark,
              title: Text(
                _appLocalizations.login_signup_setUpYourProfile,
                style: const TextStyle(fontSize: 24),
              ),
              shape: const Border(),
              centerTitle: true,
            ),
            resizeToAvoidBottomInset: false,
            body: BlocListener(
              bloc: _mainBloc,
              listener: _mainBlocListener,
              child: SafeArea(
                child: GestureDetector(
                  onTap: () {
                    SystemChannels.textInput.invokeMethod('TextInput.hide');
                  },
                  onVerticalDragEnd: (_) {
                    SystemChannels.textInput.invokeMethod('TextInput.hide');
                  },
                  child: Container(
                    padding: EdgeInsets.only(top: 15.0.h),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _uploadPhotoButton,
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.only(
                            left: 25,
                            right: 25,
                            top: 30,
                          ),
                          child: _nameAndUsername(),
                        ),
                        const Spacer(),
                        _continueButton(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}
