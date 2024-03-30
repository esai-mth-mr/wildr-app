import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_text_field.dart';

class EmailTextField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final String? errorMessage;

  const EmailTextField({
    super.key,
    required this.controller,
    this.onChanged,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) => ChallengesTextField(
        controller: controller,
        onChanged: onChanged,
        keyboardType: TextInputType.emailAddress,
        headerText: 'Email',
        autocorrect: false,
        enableSuggestions: false,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.email],
        error: errorMessage,
      );
}
