import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_navigation/src/snackbar/snackbar.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_cover.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/details_section.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/my_progress_tab.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_entries_tab.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_leaderboard_tab.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_actions.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_confirmation.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/services/invite_code_actions.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[SingleChallengePage]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [SingleChallengePage]: $message');
}

class SingleChallengePage extends StatelessWidget {
  final String challengeId;
  final String? commentToNavigateToId;
  final String? replyToNavigateToId;

  const SingleChallengePage({
    super.key,
    required this.challengeId,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
  });

  @override
  Widget build(BuildContext context) => ChallengesTheme(
        child: Builder(
          builder: (context) => BlocProvider(
            create: (context) => SingleChallengeBloc(
              challengeId: challengeId,
              gqlBloc: Common().mainBloc(context).gqlBloc,
            ),
            child: _SingleChallengeBody(
              challengeId,
              commentToNavigateToId,
              replyToNavigateToId,
            ),
          ),
        ),
      );
}

class _SingleChallengeBody extends StatefulWidget {
  final String challengeId;
  final String? commentToNavigateToId;
  final String? replyToNavigateToId;

  const _SingleChallengeBody(
    this.challengeId,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
  );

  @override
  State<_SingleChallengeBody> createState() => _SingleChallengeBodyState();
}

class _SingleChallengeBodyState extends State<_SingleChallengeBody>
    with TickerProviderStateMixin {
  bool get _hasJoinedChallenge => _challenge.hasJoined;
  final List<String> _tabNames = [];
  final List<Widget> _tabs = [];
  int _currentTabIndex = 0;
  TabController? _tabController;
  bool hasTabInit = false;
  late final MainBloc _mainBloc;
  bool _canNavigateToCommentsPage = true;

  String? _errorMessage;

  SingleChallengeBloc get _bloc => context.read<SingleChallengeBloc>();

  late Challenge _challenge = _bloc.challenge;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  bool _isGeneratingInviteCode = false;

  void _createTabDetail() {
    _tabNames.clear();
    _tabs.clear();
    _tabNames.addAll(
      [
        'Entries',
        if (_hasJoinedChallenge && !_challenge.hasNotStarted) 'My progress',
        'Leaderboard',
      ],
    );
    _tabs.addAll([
      const SingleChallengeEntriesTab(),
      if (_hasJoinedChallenge && !_challenge.hasNotStarted)
        const SingleChallengeMyProgressTab(),
      const SingleChallengeLeaderboardTab(),
    ]);
    if (_tabController != null) {
      _tabController?.removeListener(_tabControllerListener);
    }
    _tabController = TabController(
      length: _tabNames.length,
      vsync: this,
      initialIndex: _currentTabIndex,
    );
    _tabController?.addListener(_tabControllerListener);
  }

  void _tabControllerListener() {
    setState(() {
      _currentTabIndex = _tabController!.index;
    });
  }

  @override
  void initState() {
    _bloc.add(GetSingleChallengeDetailsEvent(_bloc.challengeId));
    _mainBloc = context.read<MainBloc>();
    // _createTabDetail();
    super.initState();
  }

  void _showLeaveConfirmationBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor:
          ChallengesStyles.of(context).bottomSheetActionsBackgroundColor,
      builder: (context) => ChallengesBottomSheetConfirmation(
        title: _appLocalizations.challenge_leaveChallengeTitle,
        description: _appLocalizations.challenge_leaveChallengeDescription,
        confirmText: _appLocalizations.challenge_leaveChallenge,
        onConfirm: () {
          setState(() {
            _challenge.isLoading = true;
          });
          _bloc.add(LeaveChallengeEvent(_bloc.challengeId));
          Navigator.pop(context);
        },
      ),
    );
  }

  Future<void> _onGenerateInviteCodeResultState(int? inviteCode) async {
    final challenge = _bloc.challenge;
    await Common().shareChallenge(
      context,
      challenge: challenge,
      inviteCode: inviteCode,
    );
  }

  Future<void> _shareChallenge() async {
    if (!Common().isLoggedIn(context)) {
      await _onGenerateInviteCodeResultState(null);
      return;
    }
    setState(() {
      _isGeneratingInviteCode = true;
    });

    Common().mainBloc(context).logCustomEvent(
      AnalyticsEvents.kTapShareChallenge,
      {
        AnalyticsParameters.kChallengeId: _challenge.id,
      },
    );

    _mainBloc.add(
      GenerateInviteCodeEvent(
        inviteCodeAction: InviteCodeAction.SHARE_CHALLENGE,
        pageId: _challenge.id,
      ),
    );
  }

  void _showActionsBottomSheet({
    required BuildContext context,
    required Challenge challenge,
  }) {
    print('isFollowing ${challenge.author.currentUserContext?.isFollowing}');
    showModalBottomSheet(
      context: context,
      backgroundColor:
          ChallengesStyles.of(context).bottomSheetActionsBackgroundColor,
      builder: (context) => ChallengeBottomSheetActions(
        actions: [
          if (!challenge.currentUserContext!.isOwner)
            ActionListTile(
              leading: const WildrIcon(
                WildrIcons.user_outline,
              ),
              title: "View ${challenge.author.handle}'s profile",
              onTap: () {
                final userId = challenge.author.id;

                Common().openProfilePage(
                  context,
                  userId,
                  author: challenge.author,
                  shouldNavigateToCurrentUser: false,
                );
              },
            ),
          if (!challenge.currentUserContext!.isOwner &&
              !(challenge.author.currentUserContext?.isFollowing ?? false))
            ActionListTile(
              leading: const WildrIcon(WildrIcons.plus_circle_outline),
              title: 'Follow ${challenge.author.handle}',
              onTap: () {
                if (!Common().isLoggedIn(context)) {
                  Common().showSnackBar(
                    context,
                    _appLocalizations.challenge_signInToFollowUser,
                  );
                  Common().openLoginPage(
                    context.router,
                    callback: (_) {
                      if (Common().isLoggedIn(context)) {
                        context.pushRoute(
                          SingleChallengePageRoute(
                            challengeId: _bloc.challengeId,
                          ),
                        );
                      }
                    },
                  );
                } else {
                  _mainBloc.add(FollowUserEvent(challenge.author.id));
                  _bloc.challenge.author.currentUserContext?.isFollowing = true;
                  setState(() {});
                  Navigator.pop(context);
                }
              },
            ),
          ActionListTile(
            leading: const WildrIcon(WildrIcons.share_outline),
            title: _appLocalizations.challenge_shareTo,
            onTap: () {
              _shareChallenge();
              Navigator.pop(context);
            },
          ),
          if (_bloc.challenge.hasJoined &&
              !challenge.currentUserContext!.isOwner)
            ActionListTile(
              leading: const WildrIcon(
                WildrIcons.leave,
              ),
              title: _appLocalizations.challenge_leaveChallenge,
              onTap: () {
                Navigator.pop(context);
                _showLeaveConfirmationBottomSheet(context);
              },
            ),
          if (!challenge.currentUserContext!.isOwner)
            ActionListTile(
              leading: const WildrIcon(
                WildrIcons.exclamation_circle_outline,
                color: WildrColors.red,
              ),
              title: _appLocalizations.challenge_reportChallenge,
              titleColor: WildrColors.red,
              onTap: () {
                Navigator.pop(context);
                Common().showReportItBottomSheet(
                  context: context,
                  reportObjectType: ReportObjectTypeEnum.CHALLENGE,
                  callback: (reportedType) {
                    _bloc.add(
                      ReportChallengeEvent(_bloc.challengeId, reportedType),
                    );
                  },
                );
              },
            ),
        ],
      ),
    );
  }

  SliverAppBar _appBar() => SliverAppBar(
        collapsedHeight: kToolbarHeight,
        expandedHeight: 200,
        floating: true,
        leading: IconButton(
          icon: CircleAvatar(
            backgroundColor: WildrColors.gray1200.withOpacity(0.25),
            child: const WildrIcon(
              WildrIcons.chevron_left_filled,
              size: 20,
              color: Colors.white,
            ),
          ),
          onPressed: () {
            _bloc.close();
            context.popRoute();
          },
        ),
        flexibleSpace: LayoutBuilder(
          builder: (context, constraints) =>
              ChallengeCoverCard(challenge: _challenge),
        ),
        // flexibleSpace: FlexibleSpaceBar(
        //   background: ChallengeCoverCard(challenge: _challenge),
        // ),
      );

  SliverToBoxAdapter _details() => SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 30, 12, 0),
          child: SingleChallengeDetailsSection(
            _challenge,
            bloc: _bloc,
            onJoinChallengePressed: () {
              if (!Common().isLoggedIn(context)) {
                Common().showSnackBar(
                  context,
                  _appLocalizations.challenge_signInPromptChallenge,
                );
                Common().openLoginPage(
                  context.router,
                  callback: (_) {
                    if (Common().isLoggedIn(context)) {
                      HomePageIntentHandler().handleHomePageIntent(
                        HomePageIntent(
                          HomePageIntentType.SINGLE_CHALLENGE,
                          ObjectId.challenge(_challenge.id),
                        ),
                        Common().mainBloc(context),
                        context.router,
                      );
                    }
                  },
                );
              } else {
                _bloc.add(JoinChallengeEvent(_bloc.challengeId));
              }
            },
            onCreatePostPressed: () {
              Common().mainBloc(context).logCustomEvent(
                ChallengesAnalyticsEvents.kTapChallengePostButton,
                {
                  ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
                },
              );

              if (_challenge.hasNotStarted) {
                Common().showSnackBar(
                  context,
                  _appLocalizations.challenge_hasNotStartedYet,
                );
              } else {
                Common().openCreatePostPage(
                  context: context,
                  challenge: _bloc.challenge,
                );
              }
            },
            onChatPressed: () {
              Common().mainBloc(context).logCustomEvent(
                ChallengesAnalyticsEvents.kTapChallengeDiscussButton,
                {
                  ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
                },
              );
              context.pushRoute(
                CommentsPageRoute(
                  parent: _challenge,
                  parentPageId: _challenge.id,
                ),
              );
            },
            onSharePressed: _shareChallenge,
            isGeneratingInviteCode: _isGeneratingInviteCode,
            onMorePressed: () {
              Common().mainBloc(context).logCustomEvent(
                ChallengesAnalyticsEvents.kTapChallengeMoreButton,
                {ChallengesAnalyticsParameters.kChallengeId: _challenge.id},
              );
              _showActionsBottomSheet(
                context: context,
                challenge: _bloc.challenge,
              );
            },
            //TODO: add on participants tapped
          ),
        ),
      );

  SliverToBoxAdapter _tabHeaders() => SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
          child: TabBar(
            controller: _tabController,
            onTap: (index) {
              Common().mainBloc(context).logCustomEvent(
                ChallengesAnalyticsEvents.kTapChallengeTab,
                {
                  ChallengesAnalyticsParameters.kChallengeId: _challenge.id,
                  ChallengesAnalyticsParameters.kTabName: _tabNames[index],
                },
              );
            },
            tabs: _tabNames
                .map((tabText) => Tab(text: tabText, height: 36))
                .toList(),
          ),
        ),
      );

  void _onRefresh() {
    _bloc.add(SingleChallengeCompleteRefreshEvent(_bloc.challengeId));
  }

  Widget _body() {
    if (_challenge.isLoading) {
      return const Center(child: CircularProgressIndicator());
    } else if (_errorMessage != null) {
      return Center(child: Text(_errorMessage!));
    }
    final Widget child = CustomScrollView(
      slivers: [
        _appBar(),
        _details(),
        _tabHeaders(),
        SliverToBoxAdapter(
          child: IndexedStack(
            index: _currentTabIndex,
            children: _tabs
                .mapIndexed(
                  // In order to avoid IndexedStack taking up the height of the
                  //largest child, hide it when it is not the current tab.
                  //
                  // We specifically use the Visibility widget so that the
                  // larger items on the bottom of the stack will be invisible.
                  (index, tab) => Visibility(
                    maintainState: true,
                    visible: _currentTabIndex == index,
                    child: tab,
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
    return RefreshIndicator(
      onRefresh: () async {
        _onRefresh();
      },
      child: child,
      // child: NotificationListener<OverscrollIndicatorNotification>(
      //   onNotification: (OverscrollIndicatorNotification overscroll) {
      //     overscroll.disallowIndicator();
      //     return true;
      //   },
      //   child: child,
      // ),
    );
  }

  void _onJoinChallenge(JoinChallengeState state) {
    if (state.errorMessage != null) {
      Common().showSnackBar(
        context,
        state.errorMessage!,
      );
    } else {
      Common().showSnackBar(context, _appLocalizations.challenge_youReIn);
      if (!(_bloc.challenge.dateText(context: context)?.contains('Starts in') ??
          false)) {
        Common().delayIt(
          () {
            Common().showGetSnackBar(
              'Add your first entry to "'
              '${_challenge.name.length > 20 ? ""
                  "${_challenge.name.substring(0, 20)}.."
                  "." : _challenge.name}" ⏰',
              snackPosition: SnackPosition.TOP,
            );
          },
          millisecond: 200,
        );
      }
      _mainBloc.add(GetMyChallengesEvent());
    }
  }

  void _onLeaveChallenge(LeaveChallengeState state) {
    if (state.errorMessage != null) {
      Common().showSnackBar(
        context,
        state.errorMessage!,
      );
    } else {
      Common().showSnackBar(
        context,
        _appLocalizations.challenge_seeYaLaterLeftChallenge,
      );
    }
  }

  void _onReportChallenge(ReportChallengeState state) {
    if (state.errorMessage != null) {
      Common().showSnackBar(
        context,
        state.errorMessage!,
      );
    } else {
      Common().showSuccessDialog(
        context,
        title: _appLocalizations.challenge_reported,
        message: reportDoneText,
      );
    }
  }

  void _singleChallengeBlocListener(context, SingleChallengeState state) {
    if (state.challengeId != _challenge.id) return;
    _challenge = _bloc.challenge;
    if (_canNavigateToCommentsPage &&
        widget.commentToNavigateToId != null &&
        !(_challenge.willBeDeleted ?? false)) {
      _openCommentsPage();
      _canNavigateToCommentsPage = false;
    }
    if (!hasTabInit) {
      hasTabInit = true;
      _createTabDetail();
    }
    if (state is JoinChallengeState) {
      _onJoinChallenge(state);
    } else if (state is LeaveChallengeState) {
      _onLeaveChallenge(state);
    } else if (state is ReportChallengeState) {
      _onReportChallenge(state);
    } else if (state is GetSingleChallengeDetailsState) {
      _createTabDetail();
      if (state.errorMessage != null) {
        _errorMessage = state.errorMessage;
      } else {
        _errorMessage = null;
      }
    }
    setState(() {});
  }

  void _mainBlocListener(BuildContext context, state) {
    if (state is FollowCTAState) {
      print('Follow CTA state');
      if (state.userId != _bloc.challenge.author.id) return;
      if (state.errorMessage != null) {
        _bloc.challenge.author.currentUserContext?.isFollowing = false;
        Common().showSnackBar(context, state.errorMessage!);
      } else {
        _bloc.challenge.author.currentUserContext?.isFollowing = true;
        Common().showSnackBar(
          context,
          'You are now following ${_bloc.challenge.author.handle}',
        );
      }
      setState(() {});
    } else if (state is NewPostCreatedState) {
      if (state.parentChallengeId == _challenge.id) {
        _bloc.add(OnNewPostCreatedEvent(_challenge.id));
      }
    } else if (state is GenerateInviteCodeResultState) {
      //Delay the task since generating firebase link and
      // opening the share menu takes around 1 sec
      Common().delayIt(
        () {
          _isGeneratingInviteCode = false;
          if (mounted) setState(() {});
        },
        millisecond: 1000,
      );
      if (state.pageId == _challenge.id) {
        _onGenerateInviteCodeResultState(state.inviteCode);
      }
    } else if (state is AuthStateChangedState) {
      _onAuthStateChangedState();
    }
  }

  void _onAuthStateChangedState() {
    _onRefresh();
    _tabController?.dispose();
    _tabController = TabController(
      length: _tabNames.length,
      vsync: this,
      initialIndex: _currentTabIndex,
    );
  }

  void _openCommentsPage() {
    debugPrint('_openCommentsPage');
    if (_challenge.willBeDeleted ?? false) {
      Common()
          .showErrorSnackBar(_appLocalizations.challenge_unavailable, context);
      return;
    }
    context.pushRoute(
      CommentsPageRoute(
        parent: _challenge,
        commentToNavigateToId: widget.commentToNavigateToId,
        replyToNavigateToId: widget.replyToNavigateToId,
        parentPageId: _challenge.id,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: WildrColors.singleChallengeBGColor(context: context),
        appBar:
            (_challenge.isLoading || _errorMessage != null) ? AppBar() : null,
        body: MultiBlocListener(
          listeners: [
            BlocListener<SingleChallengeBloc, SingleChallengeState>(
              listener: _singleChallengeBlocListener,
            ),
            BlocListener<MainBloc, MainState>(listener: _mainBlocListener),
          ],
          child: _body(),
        ),
      );

  @override
  void dispose() {
    hasTabInit = false;
    _mainBloc.add(
      CancelChallengeAllConnectionsSubscriptionEvent(widget.challengeId),
    );
    super.dispose();
  }
}
