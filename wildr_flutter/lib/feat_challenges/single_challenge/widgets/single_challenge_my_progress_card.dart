import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SingleChallengeMyProgressCard extends StatelessWidget {
  final int entryNumber;
  final bool isCurrent;
  final Post? post;
  final VoidCallback? onTap;

  const SingleChallengeMyProgressCard({
    super.key,
    required this.entryNumber,
    required this.isCurrent,
    this.post,
    this.onTap,
  });

  Widget _entryNumberText() => Text(
      entryNumber.toString(),
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        shadows: [
          Shadow(
            blurRadius: 2,
            color: WildrColors.black.withOpacity(0.25),
          ),
        ],
      ),
    );

  Widget _addIcon() => Center(
      child: WildrIcon(
        WildrIcons.plus_circle_outline,
        color: isCurrent ? null : WildrColors.gray1000,
      ),
    );

  Decoration _decorationStyle() => BoxDecoration(
      borderRadius: BorderRadius.circular(6),
      color: isCurrent ? WildrColors.emerald800 : null,
      border: Border.all(
        color: isCurrent ? WildrColors.white : WildrColors.gray900,
      ),
    );

  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: onTap,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: _decorationStyle(),
        child: Stack(
          children: [
            if (post != null) PostTile(post!) else Container(),
            Padding(
              padding: const EdgeInsets.all(6),
              child: _entryNumberText(),
            ),
            if (post == null) _addIcon(),
          ],
        ),
      ),
    );
}
