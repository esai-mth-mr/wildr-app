import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeOnboardingCard extends StatelessWidget {
  final Widget? leading;
  final String title;
  final String subtitle;
  final VoidCallback onClose;

  const ChallengeOnboardingCard({
    super.key,
    this.leading,
    required this.title,
    required this.subtitle,
    required this.onClose,
  });

  Widget _closeWidget() => GestureDetector(
      onTap: onClose,
      child: const Padding(
        padding: EdgeInsets.all(8.0),
        child: WildrIcon(
          WildrIcons.x_filled,
          size: 16,
          color: WildrColors.white,
        ),
      ),
    );

  Widget _centerTitleSubTitleWidget(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            style: styles.headline3TextStyle.copyWith(color: WildrColors.white),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              fontWeight: FontWeight.normal,
              color: WildrColors.white,
            ),
          ),
        ],
      ),
    );
  }

  Decoration _decorationStyle() => const BoxDecoration(
      color: WildrColors.emerald900,
      borderRadius: BorderRadius.all(
        Radius.circular(8),
      ),
    );

  @override
  Widget build(BuildContext context) => Stack(
      alignment: Alignment.topRight,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          decoration: _decorationStyle(),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: 16),
              ],
              _centerTitleSubTitleWidget(context),
            ],
          ),
        ),
        _closeWidget(),
      ],
    );
}
