import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/firebase_auth_linker.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/status_and_error.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_states.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/widgets/email_text_field.dart';
import 'package:wildr_flutter/login_signup/widgets/password_text_field.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/utils/extensions.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class LinkEmailPage extends StatefulWidget {
  const LinkEmailPage({super.key});

  @override
  State<LinkEmailPage> createState() => _LinkEmailPageState();
}

class _LinkEmailPageState extends State<LinkEmailPage> {
  late TextEditingController _password;

  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  late TextEditingController _email;
  late EmailFBAuthProvider _emailFBAuthProvider;
  late CurrentUserProfileGxC profileGxC = Get.find(tag: CURRENT_USER_TAG);
  late WildrUser user = profileGxC.user;

  @override
  void initState() {
    _password = TextEditingController();
    _email = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _password.dispose();
    _email.dispose();
    super.dispose();
  }

  Widget _profileImage() =>
      Center(child: ProfilePageCommon().profileImageCircleAvatar(user));

  Widget _emailTextBox() => Padding(
        padding: const EdgeInsets.all(8.0),
        child: EmailTextField(controller: _email),
      );

  Widget _passwordTextBox() => Padding(
        padding: const EdgeInsets.all(8.0),
        child: PasswordTextField(
          passwordTextController: _password,
          // controller: _password,
          // keyboardAppearance: Theme.of(context).brightness,
          // autofillHints: const [AutofillHints.password],
          // obscureText: true,
          // autocorrect: false,
          // enableSuggestions: false,
          // style: TextStyle(fontSize: 18.0.w),
          // textInputAction: TextInputAction.done,
          // decoration: InputDecorations.denseDecoration(
          //   _appLocalizations.profile_cap_password,
          // ),
        ),
      );

  Future<void> _link() async {
    context.loaderOverlay.show();
    try {
      _emailFBAuthProvider = EmailFBAuthProvider(
        email: _email.text,
        password: _password.text,
      );
      final StatusAndMessage link = await _emailFBAuthProvider.link(
        LoginType.EMAIL,
        context,
      );
      if (!link.isSuccessful) {
        context.loaderOverlay.hide();
        Common().showErrorSnackBar(link.message, context);
      } else {
        Common().mainBloc(context).add(RequestVerificationEmailEvent());
      }
    } catch (e) {
      context.loaderOverlay.hide();
      if (e is FirebaseAuthException) {
        if (e.code == 'weak-password') {
          Common()
              .showSnackBar(context, _appLocalizations.profile_passwordTooWeak);
        } else if (e.code == 'email-already-in-use') {
          Common().showSnackBar(
            context,
            _appLocalizations.profile_emailAlreadyExists,
          );
        }
      } else {
        Common().showErrorSnackBar(kSomethingWentWrong, context);
      }
    }
  }

  Widget _linkButton() => ElevatedButton(
        style: ButtonStyle(
          backgroundColor:
              MaterialStateProperty.all<Color>(WildrColors.primaryColor),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22.0),
            ),
          ),
        ),
        onPressed: _link,
        child: Text(
          _appLocalizations.profile_cap_link,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      );

  Widget _content() => SingleChildScrollView(
        child: SizedBox(
          height: MediaQuery.of(context).heightExcludingVerticalPadding(),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(25),
                child: _profileImage(),
              ),
              SizedBox(height: 10.0.h),
              _emailTextBox(),
              _passwordTextBox(),
              _linkButton(),
            ],
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: Common().appbarWithActions(
          title: _appLocalizations.profile_linkEmail,
        ),
        body: BlocListener<MainBloc, MainState>(
          listener: (context, st) {
            final state = st;
            if (state is RequestVerificationEmailState) {
              context.loaderOverlay.hide();
              if (state.message == null) {
                context.popRoute(true);
                return;
              }
              Common().showErrorSnackBar(state.message!, context);
              return;
            }
          },
          child: SafeArea(
            child: Center(
              child: _content(),
            ),
          ),
        ),
      );
}
