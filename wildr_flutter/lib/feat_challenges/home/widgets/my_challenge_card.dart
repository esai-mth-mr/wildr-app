import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/author_with_avatar_row.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_challenges/widgets/duration_chip.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class MyChallengeCard extends StatelessWidget {
  final Challenge challenge;
  final VoidCallback? onTap;

  const MyChallengeCard({
    super.key,
    required this.challenge,
    this.onTap,
  });

  Widget _coverImage(BuildContext context) {
    final gradientStartColor = WildrColors.black.withOpacity(0.4125);

    const borderRadius = BorderRadius.only(
      topLeft: Radius.circular(4),
      topRight: Radius.circular(4),
    );
    if (challenge.cover?.coverImageEnum != null) {
      return Container(
        foregroundDecoration: BoxDecoration(
          borderRadius: borderRadius,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              gradientStartColor,
              if (challenge.isCompleted ?? false)
                gradientStartColor
              else
                Colors.transparent,
            ],
          ),
        ),
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          image: DecorationImage(
            image: challenge.cover!.coverImageEnum!.image.provider(),
            fit: BoxFit.cover,
          ),
        ),
      );
    } else if (challenge.coverImageUri != null) {
      return Container(
        foregroundDecoration: BoxDecoration(
          borderRadius: borderRadius,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              gradientStartColor,
              if (challenge.isCompleted ?? false)
                gradientStartColor
              else
                Colors.transparent,
            ],
          ),
        ),
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          image: DecorationImage(
            image: CachedNetworkImageProvider(
              challenge.coverImageUri!,
            ),
            fit: BoxFit.cover,
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        color: Theme.of(context).colorScheme.background,
      ),
    );
  }

  Widget _avatarImage() => Align(
        alignment: Alignment.topLeft,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: AuthorWithAvatarRow(author: challenge.author),
        ),
      );

  Widget _timestamp() => Align(
        alignment: Alignment.bottomRight,
        child: ChallengeDurationChip(
          challenge,
          key: ValueKey(challenge.name),
          margin: const EdgeInsets.only(bottom: 6, right: 10),
          truncate: true,
        ),
      );

  Widget _card(context) => Expanded(
        child: Stack(
          children: [
            _coverImage(context),
            _avatarImage(),
            _timestamp(),
          ],
        ),
      );

  Widget _challengeName(BuildContext context) {
    final titleTextStyle = TextStyle(
      fontSize: 12.0.sp,
      // height: 0.8.sp,
      fontWeight: FontWeight.bold,
      fontFamily: FontFamily.satoshi,
    );
    return Container(
      width: double.infinity,
      height: 50.0.sp,
      decoration: BoxDecoration(
        color: ChallengesStyles.of(context).myChallengeCard,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(4),
          bottomRight: Radius.circular(4),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      // Workaround for the lack of a minLines parameter
      // Add a newline character at the end to add an extra line at all
      // times, but always constraint the text to 2 lines max.
      // Source: https://stackoverflow.com/questions/62561763/is-it-possible-to-force-text-widget-to-use-two-line-space
      child: Text(
        '${challenge.name}\n',
        style: titleTextStyle,
        maxLines: 2,
        textHeightBehavior: const TextHeightBehavior(
          applyHeightToFirstAscent: false,
          applyHeightToLastDescent: false,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _card(context),
            _challengeName(context),
          ],
        ),
      );
}
