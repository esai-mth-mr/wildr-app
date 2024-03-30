import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/author_with_avatar_row.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeEntryCard extends StatelessWidget {
  final bool shouldShowAuthor;
  final bool showBorder;
  final ChallengeEntry entry;
  final int? entryNumber;
  final int? maxLines;
  final double? maxFontSize;
  final bool isDense;
  final int type;

  const ChallengeEntryCard(
    this.entry, {
    super.key,
    this.shouldShowAuthor = false,
    this.showBorder = false,
    this.entryNumber,
    this.maxLines = 8,
    this.maxFontSize = 16,
    this.isDense = false,
    this.type = 1,
  });

  static const double _clipRadius = 5;

  bool get hidden => entry.post.isHiddenOnChallenge ?? false;

  Widget get _entryNumberText => Text(
        '${entryNumber ?? 0}',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: entry.isForFuture ||
                  (!entry.isToBePostedEntry && !entry.isForFuture)
              ? null
              : Colors.white,
        ),
      );

  Widget _author(BuildContext context) => Align(
        alignment: Alignment.bottomLeft,
        child: Padding(
          padding: const EdgeInsets.all(6.0),
          child: entry.isLoading
              ? Common().wrapInShimmer(
                  const CircleAvatar(child: Text('--')),
                )
              : GestureDetector(
                  // Use opaque to allow tapping between the whitespace gaps.
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    Common().openProfilePage(
                      context,
                      entry.post.author.id,
                      author: entry.post.author,
                    );
                  },
                  child: AuthorWithAvatarRow(
                    author: entry.post.author,
                    type: type,
                  ),
                ),
        ),
      );

  Widget _pinned() {
    Color color = WildrColors.white;
    if ((entry.post.subPosts?.length ?? 0) > 0 &&
        entry.post.subPosts?.first.type == 1) {
      color = WildrColors.textColorStrong();
    }
    return WildrIcon(
      WildrIcons.pin_filled,
      color: color,
      size: isDense ? 15 : 20,
    );
  }

  Widget get _topLeft {
    final Widget child;
    if (entry.post.isPinnedToChallenge ?? false) {
      child = _pinned();
    } else if (entryNumber != null) {
      child = _entryNumberText;
    } else {
      child = const SizedBox.shrink();
    }
    return Align(
      alignment: Alignment.topLeft,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: child,
      ),
    );
  }

  Widget _bottomLeft(BuildContext context) {
    if (shouldShowAuthor) return _author(context);
    return const SizedBox.shrink();
  }

  Widget _toBePostedEntry(BuildContext context) => Center(
        child: WildrIcon(
          WildrIcons.plus_circle_outline,
          color: entry.isForFuture
              ? ChallengesStyles.of(context).entryCardBorderColor
              : Colors.white,
        ),
      );

  Widget get _shimmerTile => Common().clipIt(
        radius: _clipRadius,
        child: Common().wrapInShimmer(
          const SizedBox.expand(child: ColoredBox(color: Colors.white)),
        ),
      );

  int getMaxLine(maxLines) {
    if (entry.post.type == 4) {
      if (entry.post.subPosts?.first.type == 1) {
        return 7;
      } else {
        return maxLines;
      }
    } else if (entry.post.type == 1) {
      return 7;
    } else {
      return maxLines;
    }
  }

  Widget _body(BuildContext context) {
    final color = entry.isToBePostedEntry ? WildrColors.primaryColor : null;
    final Widget child;
    if (entry.isToBePostedEntry || entry.isForFuture) {
      child = _toBePostedEntry(context);
    } else if (entry.isLoading) {
      child = _shimmerTile;
    } else {
      child = PostTile(
        entry.post,
        shouldRenderRichText: !isDense,
        maxLines: getMaxLine(maxLines),
        maxFontSize: maxFontSize,
        isDense: isDense,
        clipRadius: _clipRadius,
        performantClip: false,
      );
    }
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        border: entry.isLoading || !showBorder
            ? null
            : Border.all(
                color: entry.isToBePostedEntry
                    ? ChallengesStyles.of(context).createEntryCardBorderColor
                    : ChallengesStyles.of(context).entryCardBorderColor,
              ),
        borderRadius: BorderRadius.circular(_clipRadius),
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) => AspectRatio(
        aspectRatio: 3 / 4,
        child: Stack(
          children: [
            _body(context),
            _topLeft,
            _bottomLeft(context),
          ],
        ),
      );
}
