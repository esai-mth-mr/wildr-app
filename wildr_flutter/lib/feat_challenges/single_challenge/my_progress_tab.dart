import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_entry_card.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_onboarding_card.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SingleChallengeMyProgressTab extends StatefulWidget {
  final bool isFullPage;
  final SingleChallengeBloc? bloc;

  const SingleChallengeMyProgressTab({
    super.key,
    this.isFullPage = false,
    this.bloc,
  });

  @override
  State<SingleChallengeMyProgressTab> createState() =>
      _SingleChallengeMyProgressTabState();
}

class _SingleChallengeMyProgressTabState
    extends State<SingleChallengeMyProgressTab>
    with AutomaticKeepAliveClientMixin {
  late final _bloc = widget.bloc ?? context.read<SingleChallengeBloc>();
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Challenge get _challenge => _bloc.challenge;

  ChallengeEntriesConnection get _entriesConnection =>
      _challenge.getNonNullEntriesConnection(
        ChallengeConnectionType.currentUserEntriesConnection,
      );
  bool showOnboarding = false;

  late final RefreshController? _controller;

  /// Total days is used to "fill in" the remaining progress cards with
  /// empty ones.
  ///
  /// If entries exceeds the max entry count (total days), defer to the
  /// list length, since we won't use empty cards anymore and will add
  /// a "create" card at the end.
  int get _itemCount {
    if (_challenge.isActive && !_entriesConnection.isShimmering) {
      if (widget.isFullPage) {
        return max(_challenge.totalDays ?? 0, _entriesLength);
      } else {
        return min(30, max(_challenge.totalDays ?? 0, _entriesLength));
      }
    } else {
      return _entriesLength;
    }
  }

  int get _entriesLength => widget.isFullPage
      ? _entriesConnection.entries.length
      : min(_entriesConnection.entries.length, 30);

  late final tag = '${_challenge.id}#'
      '${ChallengeConnectionType.currentUserEntriesConnection}';
  late final FeedGxC _feedGxC;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _controller = widget.isFullPage ? RefreshController() : null;
    _feedGxC = Get.put(FeedGxC(), tag: tag);
    if (widget.isFullPage) {
      _paginate();
    } else {
      _refresh();
    }
  }

  void _goToCreatePostPage() {
    Common().openCreatePostPage(context: context, challenge: _challenge);
  }

  void _refresh() {
    if (_entriesConnection.isRefreshing) return;
    _bloc.add(PaginateCurrentUserEntriesEvent(_challenge.id));
  }

  void _paginate() {
    if (!widget.isFullPage) {
      return;
    }
    if (!_entriesConnection.canPaginate) {
      _controller?.loadNoData();
      return;
    }
    _bloc.add(
      PaginateCurrentUserEntriesEvent(
        _challenge.id,
        after: _entriesConnection.afterCursor,
      ),
    );
  }

  Widget get _onboardingCard => Padding(
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
        child: InkWell(
          onTap: () {
            Common().mainBloc(context).logCustomEvent(
              ChallengesAnalyticsEvents.kTapChallengeCreateEntryOnboardingCard,
              {
                ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
              },
            );

            _goToCreatePostPage();
          },
          child: ChallengeOnboardingCard(
            title: _appLocalizations.challenge_createYourFirstEntry,
            subtitle: _appLocalizations.challenge_createYourFirstEntrySubTitle,
            onClose: () => setState(() => showOnboarding = false),
          ),
        ),
      );

  Widget get _entriesCountTitle {
    final userEntriesCount = _challenge.currentUserProgressCount ?? 0;
    final totalDays = _challenge.totalDays ?? -1;
    String text = [userEntriesCount, totalDays].join('/').toString();
    if (userEntriesCount == totalDays) {
      text += ' 🎉';
    } else if (userEntriesCount > totalDays) {
      text = '$userEntriesCount entries';
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      child: Text(
        text,
        style: ChallengesStyles.of(context).headline3TextStyle,
      ),
    );
  }

  void _onTap(index) {
    if (_entriesConnection.entries[index].isToBePostedEntry) {
      Common().mainBloc(context).logCustomEvent(
        ChallengesAnalyticsEvents.kTapChallengeCreateEntryCard,
        {
          ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
          ChallengesAnalyticsParameters.kPostId:
              _entriesConnection.entries[index].post.id,
        },
      );
      _goToCreatePostPage();
      return;
    }

    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kTapChallengeEntryCard,
      {
        ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
        ChallengesAnalyticsParameters.kPostId:
            _entriesConnection.entries[index].post.id,
        ChallengesAnalyticsParameters.kLocation:
            _appLocalizations.challenge_myProgress,
      },
    );

    _feedGxC
      ..currentIndex = index
      ..updateCurrentVisiblePost();
    context.pushRoute(
      PostsFeedPageRoute(
        onRefresh: _refresh,
        feedGxC: _feedGxC,
        mainBloc: context.read<MainBloc>(),
        canPaginate: _entriesConnection.canPaginate,
        paginate: _paginate,
        heroTag: '',
        pageId: _bloc.pageId,
      ),
    );
  }

  Widget get _entriesGrid => GridView.builder(
        padding: const EdgeInsets.only(
          left: 12,
          right: 12,
          top: 10,
        ),
        shrinkWrap: true,
        physics:
            widget.isFullPage ? null : const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          childAspectRatio: 3 / 4,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
        ),
        itemBuilder: (context, index) {
          if (index == _entriesLength - 3) {
            _paginate();
          }
          if (index < _entriesLength) {
            return GestureDetector(
              onTap: () {
                _onTap(index);
              },
              child: ChallengeEntryCard(
                _entriesConnection.entries[index],
                entryNumber: index + 1,
                maxFontSize: 10,
                maxLines: 5,
                isDense: true,
                showBorder: true,
              ),
            );
          }
          if (_challenge.currentUserProgressCount != null) {
            if (index < _challenge.currentUserProgressCount!) {
              return ChallengeEntryCard(
                ChallengeEntry.shimmer(),
                entryNumber: index + 1,
              );
            }
          }
          return ChallengeEntryCard(
            ChallengeEntry.future(),
            entryNumber: index + 1,
            showBorder: true,
          );
        },
        itemCount: _itemCount,
      );

  Widget get _body {
    if (widget.isFullPage) {
      return SmartRefresher(
        controller: _controller!,
        onRefresh: _refresh,
        onLoading: _paginate,
        enablePullUp: true,
        header: Common().defaultClassicHeader,
        footer: createEmptyPaginationFooter(
          additionalHeight: MediaQuery.of(context).padding.bottom,
        ),
        child: _entriesGrid,
      );
    }
    return Container(
      color: WildrColors.singleChallengeBGColor(context: context),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
      child: Scrollable(
        viewportBuilder: (context, position) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (showOnboarding) _onboardingCard,
            if ((_challenge.isCompleted ?? false) &&
                _challenge.currentUserProgressCount == 0)
              Padding(
                padding: const EdgeInsets.only(top: 100),
                child: Center(
                  child: Text(
                    _appLocalizations.challenge_didNotMakeAnyProgress,
                    style: ChallengesStyles.of(context).hintTextStyle,
                  ),
                ),
              )
            else
              _entriesCountTitle,
            _entriesGrid,
            if (_shouldShowMoreButton)
              Center(
                child: TextButton(
                  onPressed: () {
                    context.pushRoute(
                      ChallengeMoreEntriesPageRoute(
                        type: ChallengeConnectionType
                            .currentUserEntriesConnection,
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
      (_entriesConnection.canPaginate ||
          max(_challenge.totalDays ?? 0, _entriesLength) > 30);

  void _listener(context, state) {
    if (state is InitPaginateCurrentUserEntriesState) {
      _refresh();
    } else if (state is PaginateCurrentUserEntriesState) {
      if (_entriesConnection.state == PaginationState.DONE_PAGINATING ||
          _entriesConnection.state == PaginationState.DONE_REFRESHING) {
        _controller?.loadComplete();
      }
      _controller?.refreshCompleted();
      _feedGxC
        ..posts = _entriesConnection.entries.map((entry) => entry.post).toList()
        ..challengeId ??= _challenge.id;
      setState(() {});
    }
    // There will be a single entry in the list that acts as the "placeholder"
    // for the create post card. If this is the only entry, we know that the
    // user has not created a post yet.
    showOnboarding = _entriesLength == 1 && _challenge.isActive;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
      listener: _listener,
      listenWhen: (prev, current) => current.challengeId == _challenge.id,
      bloc: _bloc,
      buildWhen: (previous, current) =>
          current.challengeId == _challenge.id &&
          current is PaginateCurrentUserEntriesState,
      builder: (context, state) => _body,
    );
  }
}

void print(dynamic message) {
  debugPrint('[SingleChallengeMyProgressTab]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [SingleChallengeMyProgressTab]: $message');
}
