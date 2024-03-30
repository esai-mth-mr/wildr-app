import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/all_entries_section.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/my_progress_tab.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_leaderboard_tab.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';

class ChallengeMoreEntriesPage extends StatelessWidget {
  final ChallengeConnectionType type;
  final SingleChallengeBloc bloc;

  const ChallengeMoreEntriesPage(this.type, this.bloc, {super.key})
      : assert(
          type == ChallengeConnectionType.allEntriesConnection ||
              type == ChallengeConnectionType.currentUserEntriesConnection ||
              type == ChallengeConnectionType.leaderboardConnection,
        );

  Widget get _body {
    if (type == ChallengeConnectionType.allEntriesConnection) {
      return ChallengeAllEntriesSection(
        isFullPage: true,
        key: ValueKey(bloc.challengeId + type.name),
        bloc: bloc,
      );
    } else if (type == ChallengeConnectionType.currentUserEntriesConnection) {
      return SingleChallengeMyProgressTab(
        isFullPage: true,
        key: ValueKey(bloc.challengeId + type.name),
        bloc: bloc,
      );
    } else if (type == ChallengeConnectionType.leaderboardConnection) {
      return SingleChallengeLeaderboardTab(
        isFullPage: true,
        key: ValueKey(bloc.challengeId + type.name),
        bloc: bloc,
      );
    }
    return const SizedBox();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: Text(type.title)),
      body: _body,
    );
}
