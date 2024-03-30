import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';

/// A widget to showcase the content of a single onboarding page, above the page
/// indicator and/or footer.
class OnboardingBodyWithOptionalTitleAndSubtitle extends StatelessWidget {
  final Widget body;
  final Widget? title;
  final Widget? subtitle;
  final String? titleText;
  final String? subtitleText;

  const OnboardingBodyWithOptionalTitleAndSubtitle({
    super.key,
    this.title,
    this.subtitle,
    this.titleText,
    this.subtitleText,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    final titleTextStyle = styles.headline1TextStyle
        .copyWith(fontSize: 24, fontWeight: FontWeight.w500);
    final subtitleTextStyle = styles.subtitle2TextStyle.copyWith(fontSize: 16);

    return Column(
      children: [
        if (title != null)
          title!
        else if (titleText != null)
          Text(
            titleText!,
            style: titleTextStyle,
            textAlign: TextAlign.center,
          ),
        if (title != null || titleText != null) const SizedBox(height: 8),
        if (subtitle != null)
          subtitle!
        else if (subtitleText != null)
          Text(
            subtitleText!,
            style: subtitleTextStyle,
            textAlign: TextAlign.center,
          ),
        Expanded(child: body),
      ],
    );
  }
}
