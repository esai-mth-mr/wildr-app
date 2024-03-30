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
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeAllEntriesSection extends StatefulWidget {
  final bool isFullPage;
  final SingleChallengeBloc? bloc;

  const ChallengeAllEntriesSection({
    super.key,
    this.isFullPage = false,
    this.bloc,
  });

  @override
  State<ChallengeAllEntriesSection> createState() =>
      _ChallengeAllEntriesSectionState();
}

class _ChallengeAllEntriesSectionState
    extends State<ChallengeAllEntriesSection> {
  SingleChallengeBloc get _bloc =>
      widget.bloc ?? context.read<SingleChallengeBloc>();

  Challenge get _challenge => _bloc.challenge;

  List<ChallengeEntry> get _entries => _entriesConnection.entries;

  ChallengeEntriesConnection get _entriesConnection =>
      _challenge.getNonNullEntriesConnection(
        ChallengeConnectionType.allEntriesConnection,
      );
  late final tag =
      '${_challenge.id}#${ChallengeConnectionType.allEntriesConnection}';
  late final FeedGxC _feedGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  String _lastPaginatedCursor = '';

  late final RefreshController? _controller;

  bool _shouldByPassIsFullPageCheck = false;

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

  int get _itemCount =>
      widget.isFullPage ? _entries.length : min(_entries.length, 30);

  Widget get _title => Text(
        _appLocalizations.challenge_allEntries,
        style: ChallengesStyles.of(context).headline3TextStyle,
      );

  // Widget get _allEntriesLoader {
  //   if (_entriesConnection.isPaginating) {
  //     return Padding(
  //       padding: EdgeInsets.only(bottom:
  //       MediaQuery.of(context).padding.bottom),
  //       child: const Center(child: CircularProgressIndicator()),
  //     );
  //   }
  //   return const SizedBox();
  // }

  void _refresh() {
    if (_entriesConnection.isRefreshing) {
      print('not refreshing');
      return;
    }
    _lastPaginatedCursor = '';
    _bloc.add(PaginateAllEntriesEvent(_challenge.id));
  }

  void _paginate() {
    if (!widget.isFullPage && !_shouldByPassIsFullPageCheck) {
      return;
    }
    if (_entriesConnection.canPaginate &&
        _entriesConnection.afterCursor != null) {
      if (_lastPaginatedCursor != _entriesConnection.afterCursor) {
        _lastPaginatedCursor = _entriesConnection.afterCursor ?? '';
        _bloc.add(
          PaginateAllEntriesEvent(
            _challenge.id,
            after: _entriesConnection.afterCursor,
          ),
        );
      } else {
        print('❌❌❌ STOPPING THE PAGINATION');
        _loadNoData();
      }
    } else {
      if (_entriesConnection.isPaginating) {
        print('PAGINATING!!');
      } else {
        print('Loading with no data');
        _loadNoData();
      }
    }
  }

  void _loadNoData() {
    _controller?.loadNoData();
    Common().delayIt(
      () {
        _controller?.loadComplete();
      },
      millisecond: 1000,
    );
  }

  void onTap(index) {
    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kTapChallengeEntryCard,
      {
        ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
        ChallengesAnalyticsParameters.kPostId:
            _entriesConnection.entries[index].post.id,
        ChallengesAnalyticsParameters.kLocation:
            _appLocalizations.challenge_allEntries,
      },
    );

    _feedGxC
      ..currentIndex = index
      ..updateCurrentVisiblePost();
    print('PUSHING and canPagiante = ${_entriesConnection.canPaginate}');
    _shouldByPassIsFullPageCheck = true;
    if (index > (_entries.length - 3)) {
      _paginate();
    }
    context
        .pushRoute(
          PostsFeedPageRoute(
            onRefresh: _refresh,
            feedGxC: _feedGxC,
            mainBloc: context.read<MainBloc>(),
            canPaginate: _entriesConnection.canPaginate,
            paginate: _paginate,
            heroTag: '',
            pageId: _bloc.pageId,
          ),
        )
        .then((value) => _shouldByPassIsFullPageCheck = false);
  }

  Widget get _entriesGrid {
    final entries = _entries;
    return GridView.builder(
      padding: const EdgeInsets.only(top: 10),
      shrinkWrap: true,
      physics: widget.isFullPage
          ? const ClampingScrollPhysics()
          : const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        childAspectRatio: 3 / 4,
        crossAxisCount: 5,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemBuilder: (context, index) => GestureDetector(
        onTap: () {
          onTap(index);
        },
        child: ChallengeEntryCard(
          entries[index],
          maxLines: 5,
          maxFontSize: 10,
          isDense: true,
        ),
      ),
      itemCount: _itemCount,
    );
  }

  Widget get _entriesUI {
    if (_entriesConnection.entries.isEmpty && _challenge.isActive) {
      return Padding(
        padding: const EdgeInsets.only(top: 15),
        child: Text(
          _appLocalizations.challenge_noEntriesYet,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            color: WildrColors.gray700,
          ),
        ),
      );
    }
    return _entriesGrid;
  }

  bool get _shouldShowMoreButton =>
      !widget.isFullPage &&
      (_entriesConnection.canPaginate || _entries.length > 30);

  Widget _body() {
    if (widget.isFullPage && _controller != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: SmartRefresher(
          enablePullUp: true,
          controller: _controller!,
          footer: createEmptyPaginationFooter(
            additionalHeight: MediaQuery.of(context).padding.bottom,
          ),
          header: Common().defaultClassicHeader,
          onRefresh: _refresh,
          onLoading: _paginate,
          child: _entriesGrid,
        ),
      );
    }
    return Padding(
      padding: EdgeInsets.fromLTRB(
        14,
        16,
        12,
        MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _title,
          _entriesUI,
          if (_shouldShowMoreButton)
            Center(
              child: TextButton(
                onPressed: () {
                  context.pushRoute(
                    ChallengeMoreEntriesPageRoute(
                      type: ChallengeConnectionType.allEntriesConnection,
                      bloc: _bloc,
                    ),
                  );
                },
                child: Text(_appLocalizations.challenge_showMore),
              ),
            ),
        ],
      ),
    );
  }

  void _listener(context, SingleChallengeState state) {
    if (state is InitPaginateAllEntriesState) {
      _refresh();
    } else if (state is PaginateAllEntriesState) {
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
  }

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
        listener: _listener,
        listenWhen: (prev, current) => current.challengeId == _challenge.id,
        bloc: _bloc,
        buildWhen: (previous, current) =>
            current.challengeId == _challenge.id &&
            current is PaginateAllEntriesState,
        builder: (context, state) => _body(),
      );

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}

void print(dynamic message) {
  debugPrint('[ChallengeAllEntriesSection]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengeAllEntriesSection]: $message');
}
