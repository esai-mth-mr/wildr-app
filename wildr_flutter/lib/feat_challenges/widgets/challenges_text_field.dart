import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? headerText;
  final Widget? header;
  final String? hintText;
  final bool focusable;
  final bool large;
  final bool expands;
  final VoidCallback? onTap;
  final VoidCallback? onEditingComplete;
  final ValueChanged<String>? onChanged;
  final int? maxLength;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final bool? enableInteractiveSelection;
  final bool? obscureText;
  final bool? autocorrect;
  final bool? enableSuggestions;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final void Function(String)? onSubmitted;
  final String? error;
  final TextCapitalization? textCapitalization;
  final bool isTrollDetected;
  final int? lineLength;
  final bool shouldShowSuffixIcon;
  final bool readOnly;
  final FocusNode? focusNode;

  /// A custom child to render "inside" the [TextField].
  /// Creates a fake [TextField] using a [Container] widget
  /// with the child inside.
  final Widget? child;

  const ChallengesTextField({
    super.key,
    this.controller,
    this.headerText,
    this.header,
    this.hintText,
    this.focusable = false,
    this.large = false,
    this.expands = false,
    this.isTrollDetected = false,
    this.onTap,
    this.onChanged,
    this.maxLength,
    this.keyboardType,
    this.child,
    this.inputFormatters,
    this.enableInteractiveSelection,
    this.obscureText,
    this.autocorrect,
    this.enableSuggestions,
    this.textInputAction,
    this.autofillHints,
    this.onSubmitted,
    this.error,
    this.textCapitalization,
    this.onEditingComplete,
    this.lineLength,
    this.shouldShowSuffixIcon = false,
    this.readOnly = false,
    this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    final int minLines = large ? 10 : 1;
    final int? maxLines = lineLength ?? (expands ? null : (large ? 10 : 1));
    final Icon? suffixIcon =
        shouldShowSuffixIcon ? const Icon(Icons.chevron_right) : null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (headerText != null)
            Text(
              headerText!,
              style: ChallengesStyles.of(context).textFieldHeaderTextStyle,
            )
          else if (header != null)
            header!,
          const SizedBox(height: 8),
          if (child != null)
            GestureDetector(
              onTap: onTap,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isTrollDetected ? Colors.red : WildrColors.gray900,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: child!,
                    ),
                    const Padding(
                      padding: EdgeInsets.only(right: 2),
                      child: Icon(
                        Icons.chevron_right,
                        color: WildrColors.gray700,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            TextField(
              autofocus: true,
              maxLength: maxLength,
              onChanged: onChanged,
              controller: controller,
              readOnly: readOnly,
              focusNode: readOnly ? _AlwaysDisabledFocusNode() : focusNode,
              minLines: minLines,
              maxLines: maxLines,
              onEditingComplete: onEditingComplete,
              decoration: InputDecoration(
                hintText: hintText,
                suffixIcon: suffixIcon,
                counterText: '',
                errorText: error?.isNotEmpty ?? false ? error : null,
              ),
              keyboardType: keyboardType,
              onTap: onTap,
              inputFormatters: inputFormatters,
              enableInteractiveSelection: enableInteractiveSelection,
              obscureText: obscureText ?? false,
              autocorrect: autocorrect ?? false,
              enableSuggestions: enableSuggestions ?? false,
              textInputAction: textInputAction,
              autofillHints: autofillHints,
              onSubmitted: onSubmitted,
              textCapitalization: textCapitalization ?? TextCapitalization.none,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
        ],
      ),
    );
  }
}

/// Used for ensuring that when we tap on the text field, there won't be a focus
/// ring around it.
class _AlwaysDisabledFocusNode extends FocusNode {
  @override
  bool get hasFocus => false;
}
