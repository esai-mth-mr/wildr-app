import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_entry_card.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeHorizontalEntriesSection extends StatefulWidget {
  final String headerText;
  final Widget? trailing;
  final bool large;
  final ChallengeConnectionType connectionType;

  const ChallengeHorizontalEntriesSection({
    super.key,
    required this.headerText,
    this.trailing,
    required this.connectionType,
    this.large = false,
  });

  @override
  State<ChallengeHorizontalEntriesSection> createState() =>
      _ChallengeHorizontalEntriesSectionState();
}

class _ChallengeHorizontalEntriesSectionState
    extends State<ChallengeHorizontalEntriesSection> {
  ChallengeEntriesConnection get _entriesConnection =>
      _challenge.getNonNullEntriesConnection(widget.connectionType);

  SingleChallengeBloc get _bloc => context.read<SingleChallengeBloc>();
  late bool _showEmptyTodayEntry = true;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Challenge get _challenge => _bloc.challenge;

  late final _challengeId = _challenge.id;

  List<ChallengeEntry> get _entries => _entriesConnection.entries;

  late final tag = '${_challenge.id}#${widget.connectionType.name}';
  late final FeedGxC _feedGxC;

  @override
  void initState() {
    super.initState();
    _feedGxC = Get.put(FeedGxC(), tag: tag);
    _refresh();
  }

  void _refresh() {
    if (_entriesConnection.isRefreshing) {
      print('Not going to refresh');
      return;
    }
    if (widget.connectionType ==
        ChallengeConnectionType.todayEntriesConnection) {
      _bloc.add(PaginateTodayEntriesEvent(_challengeId));
    } else if (widget.connectionType ==
        ChallengeConnectionType.featuredEntriesConnection) {
      _bloc.add(PaginateFeaturedEntriesEvent(_challengeId));
    }
  }

  void _paginate() {
    if (!_entriesConnection.canPaginate) {
      return;
    }
    print('Paginating horizontal entries...');
    final afterCursor = _entriesConnection.afterCursor;
    if (afterCursor == null || afterCursor.isEmpty) {
      return;
    }

    if (widget.connectionType ==
        ChallengeConnectionType.todayEntriesConnection) {
      _bloc.add(
        PaginateTodayEntriesEvent(_challengeId, after: afterCursor),
      );
    } else if (widget.connectionType ==
        ChallengeConnectionType.featuredEntriesConnection) {
      _bloc.add(
        PaginateFeaturedEntriesEvent(_challengeId, after: afterCursor),
      );
    }
  }

  void onTap(int index) {
    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kTapChallengeEntryCard,
      {
        ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
        ChallengesAnalyticsParameters.kPostId:
            _entriesConnection.entries[index].post.id,
        ChallengesAnalyticsParameters.kLocation: widget.headerText,
      },
    );

    _feedGxC
      ..currentIndex = index
      ..updateCurrentVisiblePost();
    if (index > (_entries.length - 3)) {
      _paginate();
    }
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

  Widget get _loader => Center(
        child: Container(
          padding: const EdgeInsets.all(16),
          child: const Center(
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );

  Widget get _entriesListView => ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: _entries.length,
        itemBuilder: (context, index) {
          if (index == _entries.length - 3) {
            _paginate();
          }
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                onTap(index);
              },
              child: ChallengeEntryCard(
                _entries[index],
                shouldShowAuthor: true,
                type: _postType(index),
              ),
            ),
          );
        },
      );

  int _postType(index) => _entries[index].post.type == 4
      ? _entries[index].post.subPosts!.first.type
      : _entries[index].post.type;

  List<Widget> get _content {
    if (_entriesConnection.entries.isEmpty) {
      if (_entriesConnection.isRefreshing && !_entriesConnection.isShimmering) {
        return [_loader];
      }
      if (_challenge.isCompleted ?? !_challenge.isActive) {
        return [
          const SizedBox.shrink(),
        ];
      }
      if (widget.connectionType ==
          ChallengeConnectionType.todayEntriesConnection) {
        if (_showEmptyTodayEntry &&
            _challenge.hasJoined &&
            _challenge.isActive) {
          return [
            _EmptyTodayItem(
              title: _appLocalizations.challenge_beTheFirstToPost,
              subTitle:
                  _appLocalizations.challenge_shareTodayVideoPhotoProgress,
              btnTitle: _appLocalizations.comm_post,
              onTap: () {
                Common().mainBloc(context).logCustomEvent(
                  ChallengesAnalyticsEvents.kTapChallengePostButton,
                  {
                    ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
                  },
                );
                context.pushRoute(
                  CreatePostPageV1Route(
                    mainBloc: Common().mainBloc(context),
                    defaultSelectedChallenge: _bloc.challenge,
                  ),
                );
              },
              closeCallback: () {
                setState(() => _showEmptyTodayEntry = false);
              },
            ),
          ];
        }
        return [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _appLocalizations.challenge_beTheFirstToPostToday,
              style: const TextStyle(color: WildrColors.gray700),
            ),
          ),
        ];
      } else if (widget.connectionType ==
          ChallengeConnectionType.featuredEntriesConnection) {
        return [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _appLocalizations.challenge_noFeaturedEntriesYet,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: WildrColors.gray700,
              ),
            ),
          ),
        ];
      }
    }
    return [
      SizedBox(
        height: widget.large ? 200 : 200,
        child: Row(
          children: [
            if (_entriesConnection.isRefreshing &&
                !_entriesConnection.isShimmering)
              _loader,
            Expanded(child: _entriesListView),
            if (_entriesConnection.isPaginating) _loader,
          ],
        ),
      ),
    ];
  }

  Widget get _heading => Padding(
        padding: const EdgeInsets.only(left: 12, right: 12, top: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.headerText,
              style: ChallengesStyles.of(context).headline3TextStyle,
            ),
            if (widget.trailing != null) widget.trailing!,
          ],
        ),
      );

  Widget get _body => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _heading,
          const SizedBox(height: 8),
          ..._content,
        ],
      );

  void _listener(context, SingleChallengeState state) {
    if (state is InitPaginateTodayEntriesState ||
        state is InitPaginateFeaturedEntriesState) {
      _refresh();
    } else if (state is PaginateTodayEntriesState ||
        state is PaginateFeaturedEntriesState) {
      if (widget.connectionType ==
              ChallengeConnectionType.todayEntriesConnection ||
          widget.connectionType ==
              ChallengeConnectionType.featuredEntriesConnection) {
        _feedGxC
          ..posts = _entries.map((entry) => entry.post).toList()
          ..challengeId ??= _challenge.id;
        setState(() {});
      }
    }
  }

  bool _buildWhen(_, SingleChallengeState current) {
    final shouldBuild = current.challengeId == _challengeId &&
        (current is PaginateFeaturedEntriesEvent ||
            current is PaginateTodayEntriesEvent);
    return shouldBuild;
  }

  bool _listenWhen(_, SingleChallengeState state) {
    if (state.challengeId != _challengeId) {
      return false;
    }
    if (widget.connectionType ==
        ChallengeConnectionType.todayEntriesConnection) {
      return state is InitPaginateTodayEntriesState ||
          state is PaginateTodayEntriesState;
    } else if (widget.connectionType ==
        ChallengeConnectionType.featuredEntriesConnection) {
      return state is InitPaginateFeaturedEntriesState ||
          state is PaginateFeaturedEntriesState;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is PinChallengeEntryState) {
            if (state.errorMessage == null) {
              _bloc.add(
                InitPaginateFeaturedEntriesEvent(
                  state.pinChallengeEntryResult?.challengeId ?? '',
                ),
              );
            }
          }
        },
        child: BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
          listener: _listener,
          listenWhen: _listenWhen,
          bloc: _bloc,
          buildWhen: _buildWhen,
          builder: (context, state) => _body,
        ),
      );
}

void print(dynamic message) {
  debugPrint('[ChallengeHorizontalEntriesSection]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengeHorizontalEntriesSection]: $message');
}

class _EmptyTodayItem extends StatelessWidget {
  final String title;
  final String subTitle;
  final String btnTitle;
  final VoidCallback onTap;
  final VoidCallback closeCallback;

  const _EmptyTodayItem({
    required this.title,
    required this.subTitle,
    required this.btnTitle,
    required this.onTap,
    required this.closeCallback,
  });

  @override
  Widget build(BuildContext context) => Stack(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color:
                  ChallengesStyles.of(context).leaderboardParticipantTileColor,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: FontFamily.slussenExpanded,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      subTitle,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        fontFamily: FontFamily.satoshi,
                      ),
                    ),
                    SizedBox(
                      width: 94,
                      child: ElevatedButton(
                        onPressed: onTap,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25.0),
                            side: BorderSide(
                              color: WildrColors.appBarTextColor(),
                            ),
                          ),
                        ),
                        child: Center(
                          child: Text(
                            btnTitle,
                            style:
                                TextStyle(color: WildrColors.appBarTextColor()),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: closeCallback,
              child: const WildrIcon(WildrIcons.closeIcon),
            ),
          ),
        ],
      );
}
