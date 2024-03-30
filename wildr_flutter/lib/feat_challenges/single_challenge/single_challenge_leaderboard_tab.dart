import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_participant_list_tile.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';

class SingleChallengeLeaderboardTab extends StatefulWidget {
  final bool isFullPage;
  final SingleChallengeBloc? bloc;

  const SingleChallengeLeaderboardTab({
    super.key,
    this.isFullPage = false,
    this.bloc,
  });

  @override
  State<SingleChallengeLeaderboardTab> createState() =>
      _SingleChallengeLeaderboardTabState();
}

class _SingleChallengeLeaderboardTabState
    extends State<SingleChallengeLeaderboardTab>
    with AutomaticKeepAliveClientMixin {
  late final _bloc = widget.bloc ?? context.read<SingleChallengeBloc>();

  ChallengeLeaderboardConnection get _leaderboardConnection =>
      _bloc.challenge.leaderboardConnection ??
      ChallengeLeaderboardConnection.shimmer();

  late final RefreshController? _controller;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _controller = widget.isFullPage ? RefreshController() : null;
    if (widget.isFullPage) {
      _paginate();
    } else {
      _refresh();
    }
  }

  void _refresh() {
    if (_leaderboardConnection.isPaginating) {
      _controller?.refreshCompleted();
      return;
    }
    _controller?.resetNoData();
    _bloc.add(PaginateLeaderboardsEvent(_bloc.challengeId));
  }

  void _paginate() {
    if (!_leaderboardConnection.canPaginate || !widget.isFullPage) {
      _controller?.loadNoData();
      return;
    }

    if (_leaderboardConnection.afterCursor == null ||
        (_leaderboardConnection.afterCursor?.isEmpty ?? false)) return;

    _bloc.add(
      PaginateLeaderboardsEvent(
        _bloc.challengeId,
        after: _leaderboardConnection.afterCursor,
      ),
    );
  }

  int get _itemCount => _leaderboardConnection.participants.length;

  List<Widget> get _title {
    if (_leaderboardConnection.participants.isEmpty) {
      return [
        Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 100),
            child: Text(
              !_bloc.challenge.isActive
                  ? _appLocalizations.challenge_leaderboardEmptyForChallenge
                  : _bloc.challenge.hasJoined
                      ? _appLocalizations.challenge_noOneOnLeaderBoardYet
                      : _appLocalizations.challenge_noParticipantsYet,
              style: ChallengesStyles.of(context).hintTextStyle,
            ),
          ),
        ),
        if (_bloc.challenge.isActive && _bloc.challenge.hasJoined) ...[
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 5, bottom: 20),
              child: Text(
                _appLocalizations.challenge_chanceToTakeTheLead,
                style: ChallengesStyles.of(context).hintTextStyle,
              ),
            ),
          ),
          Center(
            child: TextButton(
              child: Text(
                _appLocalizations.challenge_postAnEntry,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onPressed: () {
                if (!Common().isLoggedIn(context)) {
                  Common().openLoginPage(
                    context.router,
                    callback: (_) {
                      if (Common().isLoggedIn(context)) {
                        HomePageIntentHandler().handleHomePageIntent(
                          HomePageIntent(
                            HomePageIntentType.SINGLE_CHALLENGE,
                            ObjectId.challenge(_bloc.challengeId),
                          ),
                          Common().mainBloc(context),
                          context.router,
                        );
                      }
                    },
                  );
                } else {
                  Common().openCreatePostPage(
                    context: context,
                    challenge: _bloc.challenge,
                  );
                }
              },
            ),
          ),
        ],
      ];
    }
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        child: Text(
          _appLocalizations.challenge_cap_leaderboard,
          style: ChallengesStyles.of(context).headline3TextStyle,
        ),
      ),
    ];
  }

  Widget get _listView => ListView.builder(
        shrinkWrap: true,
        physics:
            widget.isFullPage ? null : const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: widget.isFullPage ? _itemCount : min(_itemCount, 11),
        itemBuilder: (context, index) {
          final participant = _leaderboardConnection.participants[index];
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ChallengeParticipantListTile(participant, bloc: _bloc),
              if (participant.isCreator ?? false)
                const Divider(height: 24)
              else
                const SizedBox(height: 8),
            ],
          );
        },
      );

  Widget get _body {
    if (_bloc.challenge.isLoading) {
      return SizedBox(
        height: MediaQuery.of(context).size.height * 0.4,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_bloc.challenge.hasNotStarted) {
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

    if (widget.isFullPage) {
      return SmartRefresher(
        controller: _controller!,
        onRefresh: _refresh,
        onLoading: _paginate,
        enablePullUp: true,
        header: Common().defaultClassicHeader,
        footer: createEmptyPaginationFooter(),
        child: _listView,
      );
    }

    return SafeArea(
      top: false,
      left: false,
      right: false,
      child: Scrollable(
        viewportBuilder: (context, position) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ..._title,
            _listView,
            if (_shouldShowMoreButton)
              Center(
                child: TextButton(
                  onPressed: () {
                    context.pushRoute(
                      ChallengeMoreEntriesPageRoute(
                        type: ChallengeConnectionType.leaderboardConnection,
                        bloc: _bloc,
                      ),
                    );
                  },
                  child: Text(_appLocalizations.challenge_showMore),
                ),
              ),
          ],
        ),
      ),
    );
  }

  bool get _shouldShowMoreButton =>
      !widget.isFullPage &&
      (_leaderboardConnection.canPaginate || _itemCount > 15);

  void _listener(context, SingleChallengeState state) {
    if (state is InitPaginateLeaderboardsState) {
      if (state.challengeId == _bloc.challengeId) {
        _refresh();
      }
    } else if (state is PaginateLeaderboardsState) {
      if (_leaderboardConnection.state == PaginationState.ERROR) {
        Common().showSomethingWentWrong(context);
        _controller?.loadComplete();
      } else if (_leaderboardConnection.state ==
          PaginationState.DONE_REFRESHING) {
        _controller?.refreshCompleted();
      } else if (_leaderboardConnection.state ==
          PaginationState.DONE_PAGINATING) {
        _controller?.loadComplete();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
      listener: _listener,
      listenWhen: (prev, current) => current.challengeId == _bloc.challengeId,
      bloc: _bloc,
      buildWhen: (prev, current) =>
          current is PaginateLeaderboardsState &&
          (current.challengeId == _bloc.challengeId),
      builder: (context, state) => _body,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}
