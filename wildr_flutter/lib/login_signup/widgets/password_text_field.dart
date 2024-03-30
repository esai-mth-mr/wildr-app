import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_text_field.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PasswordTextField extends StatefulWidget {
  final TextEditingController passwordTextController;
  final void Function(String)? onSubmitted;
  final bool shouldShowForgotPassword;
  final ValueChanged<String>? onChanged;
  final String? errorMessage;

  const PasswordTextField({
    super.key,
    required this.passwordTextController,
    this.onSubmitted,
    this.shouldShowForgotPassword = true,
    this.onChanged,
    this.errorMessage,
  });

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  bool _isObscuringText = true;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  Widget build(BuildContext context) => ChallengesTextField(
        controller: widget.passwordTextController,
        header: Row(
          children: [
            Text(
              _appLocalizations.profile_cap_password,
              style: ChallengesStyles.of(context).textFieldHeaderTextStyle,
            ),
            const SizedBox(width: 4),
            IconButton(
              onPressed: () => setState(
                () => _isObscuringText = !_isObscuringText,
              ),
              iconSize: 16,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              icon: WildrIcon(
                _isObscuringText
                    ? WildrIcons.eye_off_outline
                    : WildrIcons.eye_outline,
              ),
            ),
            if (widget.shouldShowForgotPassword) ...[
              const Spacer(),
              GestureDetector(
                onTap: () {
                  context.pushRoute(
                    const ForgotPasswordPageRoute(),
                  );
                },
                child: Text(
                  _appLocalizations.login_signup_forgotPassword,
                  style: TextStyle(
                    color: WildrColors.textColor().withOpacity(0.6),
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ],
        ),
        focusable: true,
        keyboardType: TextInputType.visiblePassword,
        onChanged: widget.onChanged,
        obscureText: _isObscuringText,
        autocorrect: false,
        onSubmitted: widget.onSubmitted,
        error: widget.errorMessage,
      );
}
