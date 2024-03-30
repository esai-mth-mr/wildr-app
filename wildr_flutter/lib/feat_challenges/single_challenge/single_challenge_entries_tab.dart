import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/all_entries_section.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/horizontal_entries_section.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_interaction_progress.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_interactions_card.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[SingleChallengeEntriesTab]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [SingleChallengeEntriesTab]: $message');
}

///Todo: Make [InteractionsCard] stateful and
/// [SingleChallengeEntriesTab] [Stateless]
class SingleChallengeEntriesTab extends StatefulWidget {
  const SingleChallengeEntriesTab({
    super.key,
  });

  @override
  State<SingleChallengeEntriesTab> createState() =>
      _SingleChallengeEntriesTabState();
}

class _SingleChallengeEntriesTabState extends State<SingleChallengeEntriesTab>
    with AutomaticKeepAliveClientMixin {
  late final SingleChallengeBloc _bloc = context.read<SingleChallengeBloc>();
  late bool _showInteractionsCard = _isAuthor && _challenge.isActive;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Challenge get _challenge => _bloc.challenge;

  bool get _isAuthor => _challenge.isOwner;

  @override
  bool get wantKeepAlive => true;


  Widget get _interactionsCard {
    final Widget child;
    if (_showInteractionsCard) {
      child = InteractionsCard(
        onClose: () {
          Common().mainBloc(context).logCustomEvent(
            ChallengesAnalyticsEvents.kCloseChallengeInteractionsCard,
            {
              ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
            },
          );

          setState(() => _showInteractionsCard = false);
        },
      );
    } else {
      child = const SizedBox();
    }
    return child;
  }

  Widget get _todayEntriesSection {
    if (_challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.todayEntriesConnection,
            )
            .entries
            .isEmpty &&
        ((_challenge.isCompleted ?? false) ||
            _challenge
                .getNonNullEntriesConnection(
                  ChallengeConnectionType.allEntriesConnection,
                )
                .entries
                .isEmpty)) return const SizedBox();
    return ChallengeHorizontalEntriesSection(
      headerText: _appLocalizations.challenge_cap_today,
      trailing: _isAuthor && _challenge.isActive
          ? GestureDetector(
              onTap: () => setState(() => _showInteractionsCard = true),
              child: InteractionsProgress(
                interactionCount: _challenge.interactionCount,
              ),
            )
          : null,
      large: !_isAuthor,
      connectionType: ChallengeConnectionType.todayEntriesConnection,
    );
  }

  Widget get _featuredEntriesSection {
    if (_challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.featuredEntriesConnection,
            )
            .entries
            .isEmpty &&
        (_challenge.isCompleted ?? false ||
            _challenge
                .getNonNullEntriesConnection(
                  ChallengeConnectionType.allEntriesConnection,
                )
                .entries
                .isEmpty)) return const SizedBox();
    return ChallengeHorizontalEntriesSection(
      headerText: _appLocalizations.challenge_cap_featured,
      large: !_isAuthor,
      connectionType: ChallengeConnectionType.featuredEntriesConnection,
    );
  }

  Widget get _allEntriesSection {
    if (_challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.allEntriesConnection,
            )
            .entries
            .isEmpty &&
        !_challenge.isActive) return const SizedBox();
    return const ChallengeAllEntriesSection();
  }

  Widget get _body {
    if (_challenge.isLoading) {
      return SizedBox(
        height: MediaQuery.of(context).size.height * 0.4,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_challenge.hasNotStarted) {
      return SizedBox(
        height: MediaQuery.of(context).size.height * 0.4,
        child: Center(
          child: Text(
            _appLocalizations.challenge_hasNotStarted,
            style: ChallengesStyles.of(context).hintTextStyle,
          ),
        ),
      );
    }

    return ColoredBox(
      color: WildrColors.singleChallengeBGColor(context: context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _interactionsCard,
          _todayEntriesSection,
          _featuredEntriesSection,
          _allEntriesSection,
          if (_isEverythingEmptyAndHasEnded)
            Padding(
              padding: const EdgeInsets.only(top: 100),
              child: Center(
                child: Text(
                  _appLocalizations.challenge_endedPostNotFound,
                  style: ChallengesStyles.of(context).hintTextStyle,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool get _isEverythingEmptyAndHasEnded {
    if (_challenge.isCompleted != true) return false;
    return _challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.todayEntriesConnection,
            )
            .entries
            .isEmpty &&
        _challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.featuredEntriesConnection,
            )
            .entries
            .isEmpty &&
        _challenge
            .getNonNullEntriesConnection(
              ChallengeConnectionType.allEntriesConnection,
            )
            .entries
            .isEmpty;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    // return _body;
    return BlocBuilder<SingleChallengeBloc, SingleChallengeState>(
      // This Builder is needed to provide a BuildContext that is
      // "inside" the NestedScrollView, so that
      // sliverOverlapAbsorberHandleFor() can find the
      // NestedScrollView.
      bloc: _bloc,
      builder: (context, state) => _body,
      buildWhen: (previous, current) => current.challengeId == _challenge.id,
    );
  }
}
