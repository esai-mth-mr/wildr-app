import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/duration_chip.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeCoverCard extends StatelessWidget {
  final Challenge? challenge;
  final bool showDaysRemaining;
  final bool roundedCorners;
  final bool useThumbnail;

  const ChallengeCoverCard({
    super.key,
    this.challenge,
    this.showDaysRemaining = true,
    this.roundedCorners = false,
    this.useThumbnail = false,
  });

  Widget _coverImage() {
    final cover = challenge?.cover;
    if (cover == null) return const SizedBox();
    final coverImage = cover.coverImage;
    final imageUrl = useThumbnail ? coverImage?.thumbUri : coverImage?.imageUri;
    if (imageUrl != null) {
      return SizedBox.expand(
        child:
            Common().imageView(imageUrl, boxFit: BoxFit.cover, borderRadius: 4),
      );
    } else if (cover.coverImageEnum != null) {
      return SizedBox.expand(
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: roundedCorners ? BorderRadius.circular(4) : null,
            image: DecorationImage(
              image: cover.coverImageEnum!.image.provider(),
              fit: BoxFit.cover,
            ),
          ),
        ),
      );
    }
    return const SizedBox();
  }

  Widget _daysRemaining() {
    if (challenge == null) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, right: 5.0),
      child: ChallengeDurationChip(
        challenge!,
        shouldShowCompleteStartDate: true,
      ),
    );
  }

  Widget _shimmerCard() => Stack(
      alignment: Alignment.bottomRight,
      children: [
        Common().wrapInShimmer(
          Container(
            width: double.infinity,
            color: Colors.white, // Placeholder color for shimmer effect
          ),
        ),
        Common().wrapInShimmer(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: WildrColors.black.withOpacity(0.35),
              borderRadius: BorderRadius.circular(100),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                WildrIcon(
                  WildrIcons.clock_outline,
                  size: 16,
                ),
                SizedBox(width: 4),
                Text('---'),
              ],
            ),
          ),
        ),
      ],
    );

  @override
  Widget build(BuildContext context) {
    if (challenge == null) {
      return _shimmerCard();
    }
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        _coverImage(),
        if (showDaysRemaining) _daysRemaining(),
      ],
    );
  }
}
