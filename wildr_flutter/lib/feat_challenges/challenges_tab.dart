import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/home/challenges_home_page.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';

class ChallengesTab extends StatefulWidget {
  const ChallengesTab({super.key});

  @override
  State<ChallengesTab> createState() => _ChallengesTabState();
}

class _ChallengesTabState extends State<ChallengesTab>
    with AutomaticKeepAliveClientMixin {
  @override
  Widget build(BuildContext context) {
    super.build(context);
    return const ChallengesTheme(
      child: ChallengesHomePage(),
    );
  }

  @override
  bool get wantKeepAlive => true;
}
