import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_challenges/widgets/duration_chip.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class MyChallengeShimmerCard extends StatelessWidget {
  const MyChallengeShimmerCard({
    super.key,
  });

  Widget _cover() => ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(4),
        topRight: Radius.circular(4),
      ),
      child: Common().wrapInShimmer(Container(color: Colors.white)),
    );

  Widget _avatar() => Align(
      alignment: Alignment.topLeft,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Common().wrapInShimmer(
          Row(
            children: [
              const CircleAvatar(radius: 10),
              const SizedBox(width: 5),
              Expanded(
                child: Container(
                  width: double.infinity,
                  height: 10,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );

  Widget _expiry() => Align(
      alignment: Alignment.bottomRight,
      child: Common().wrapInShimmer(
        ChallengeDurationChip(
          Challenge.empty(),
          margin: const EdgeInsets.only(bottom: 6, right: 10),
          truncate: true,
        ),
      ),
    );

  Widget _name(BuildContext context) {
    final titleTextStyle = TextStyle(
      fontSize: 12.0.sp,
      fontWeight: FontWeight.bold,
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
      padding: const EdgeInsets.all(8),
      child: Common().wrapInShimmer(
        Text(
          '- - - \n- - -\n -',
          style: titleTextStyle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Stack(
            children: [
              _cover(),
              _avatar(),
              _expiry(),
            ],
          ),
        ),
        _name(context),
      ],
    );
}
