import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/error_message_with_retry.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_participant_list_tile.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[ParticipantsBottomSheet]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ParticipantsBottomSheet]: $message');
}

class ParticipantsBottomSheet extends StatefulWidget {
  final String challengeId;
  final SingleChallengeBloc bloc;

  const ParticipantsBottomSheet(
    this.challengeId,
    this.bloc, {
    super.key,
  });

  @override
  State<ParticipantsBottomSheet> createState() =>
      _ParticipantsBottomSheetState();
}

class _ParticipantsBottomSheetState extends State<ParticipantsBottomSheet> {
  SingleChallengeBloc get _bloc => widget.bloc;

  ChallengeParticipantsConnection get _connection =>
      _bloc.challenge.participantsConnection ??
      ChallengeParticipantsConnection.shimmer();

  Challenge get _challenge => _bloc.challenge;

  PaginationState get _state => _connection.state;

  List<ChallengeParticipant> get _participantsList => _connection.participants;
  List<ChallengeParticipant> _creatorParticipantsList = [];
  List<ChallengeParticipant> _friendsParticipantsList = [];
  List<ChallengeParticipant> _allOthersParticipantsList = [];

  late final RefreshController _refreshController =
      RefreshController(initialRefresh: true);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  void _onRefresh() {
    if (_connection.isRefreshing) {
      print('Already refreshing');
      return;
    }
    _bloc.add(PaginateParticipantsEvent(widget.challengeId));
  }

  void _onLoadMore() {
    if (_connection.canPaginate && !_connection.isPaginating) {
      _bloc.add(
        PaginateParticipantsEvent(
          widget.challengeId,
          after: _connection.afterCursor,
        ),
      );
    } else {
      _refreshController.loadNoData();
    }
  }

  Widget _topDivider() => Container(
        alignment: Alignment.center,
        child: const BottomSheetTopDivider(widthFactor: 0.20),
      );

  Widget _backBtn() => Padding(
        padding: EdgeInsets.only(bottom: 16.0.h, top: 5.0.h, left: 20.0.w),
        child: InkWell(
          onTap: context.popRoute,
          child: Icon(Icons.arrow_back_ios_new, size: 18.0.wh),
        ),
      );

  String _titleText() {
    final String suffix;
    final participantsCount = _challenge.stats?.participantCount ?? 0;
    if (_participantsList.length == 1) {
      suffix = _appLocalizations.challenge_participant;
    } else {
      suffix = _appLocalizations.challenge_participants;
    }
    return '$participantsCount $suffix';
  }

  Widget _title() => Expanded(
        child: Container(
          padding: EdgeInsets.only(bottom: 16.0.h, top: 5.0.h, right: 40.0.w),
          alignment: Alignment.center,
          child: Text(
            _titleText(),
            style: TextStyle(fontSize: 18.0.sp, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center, // Center the text horizontally
          ),
        ),
      );

  bool get _isErrorState => _state == PaginationState.ERROR;

  Widget _errorMessageWithRetry() => SliverToBoxAdapter(
        child: ChallengesListErrorMessageWithRetry(
          errorMessage: _connection.errorMessage ?? kSomethingWentWrong,
          refresh: _onRefresh,
        ),
      );

  bool get _shouldShowBeTheFirstToJoin =>
      areAllListsEmpty() &&
      !_challenge.isOwner &&
      !_challenge.hasJoined &&
      _refreshController.headerMode?.value == RefreshStatus.completed;

  bool get _shouldShowChallengeYourFriendBanner =>
      areAllListsEmpty() &&
      _challenge.isOwner &&
      _refreshController.headerMode?.value == RefreshStatus.completed;

  Widget _listView() => Expanded(
        child: SmartRefresher(
          controller: _refreshController,
          onRefresh: _onRefresh,
          onLoading: _onLoadMore,
          enablePullUp: true,
          header: const MaterialClassicHeader(color: WildrColors.primaryColor),
          footer: createEmptyPaginationFooter(),
          child: CustomScrollView(
            slivers: _isErrorState
                ? [_errorMessageWithRetry()]
                : [
                    if (_creatorParticipantsList.isNotEmpty) ...[
                      _TitleText(
                        title: _appLocalizations.challenge_cap_creator,
                        leftPadding: 12.0.w,
                        topPadding: 8.0.h,
                      ),
                      _ParticipantSectionListView(
                        participantsList: _creatorParticipantsList,
                        bloc: _bloc,
                      ),
                    ],
                    if (_shouldShowChallengeYourFriendBanner) ...[
                      _challengeYourFriendBanner(),
                    ],
                    if (_shouldShowBeTheFirstToJoin) ...[
                      _beTheFirstToJoinBanner(),
                    ],
                    if (_friendsParticipantsList.isNotEmpty) ...[
                      _TitleText(
                        title: _appLocalizations.challenge_yourFriends,
                        leftPadding: 12.0.w,
                      ),
                      _ParticipantSectionListView(
                        participantsList: _friendsParticipantsList,
                        bloc: _bloc,
                      ),
                    ],
                    if (_allOthersParticipantsList.isNotEmpty) ...[
                      _TitleText(
                        title: _appLocalizations.challenge_allParticipants,
                        leftPadding: 12.0.w,
                      ),
                      _ParticipantSectionListView(
                        participantsList: _allOthersParticipantsList,
                        bloc: _bloc,
                      ),
                    ],
                  ],
          ),
        ),
      );

  Widget _challengeYourFriendBanner() => _EmptyParticipantsItem(
        title: _appLocalizations.challenge_yourFriends,
        subTitle: _appLocalizations.challenge_inviteFriendsToJoinChallenge,
        btnTitle: _appLocalizations.challenge_shareTo,
        onTap: () {
          Navigator.pop(context);
          Common().shareChallenge(
            context,
            challenge: _challenge,
          );
        },
      );

  Widget _beTheFirstToJoinBanner() => _EmptyParticipantsItem(
        title: _appLocalizations.challenge_beTheFirstToJoin,
        subTitle: _appLocalizations.challenge_beFirstToTakeOnThisChallenge,
        btnTitle: _appLocalizations.challenge_cap_join,
        onTap: () {
          Navigator.pop(context);
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
      );

  bool areAllListsEmpty() =>
      _creatorParticipantsList.isNotEmpty &&
      _friendsParticipantsList.isEmpty &&
      _allOthersParticipantsList.isEmpty;

  Widget _body() => DecoratedBox(
        decoration: BoxDecoration(
          color: WildrColors.participantBottomSheetBackColor(context),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(10.0.w),
            topRight: Radius.circular(10.0.w),
          ),
        ),
        child: Column(
          children: [
            _topDivider(),
            Row(children: [_backBtn(), _title()]),
            const Divider(height: 2, thickness: 2),
            _listView(),
          ],
        ),
      );

  void _listener(context, state) {
    _creatorParticipantsList =
        _participantsList.where((p) => p.isCreator ?? false).toList();
    _friendsParticipantsList = _participantsList
        .where((p) => p.isCreator == false && (p.isFriend ?? false))
        .toList();
    _allOthersParticipantsList = _participantsList
        .where((p) => p.isCreator == false && p.isFriend == false)
        .toList();
    print('_connection.state = ${_connection.state}');
    switch (_connection.state) {
      case PaginationState.DONE_REFRESHING:
      case PaginationState.DONE_PAGINATING:
        _refreshController.refreshCompleted();
        _refreshController.loadComplete();
      case PaginationState.ERROR:
        _refreshController.refreshFailed();
      // ignore: no_default_cases
      default:
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
        builder: (context, state) => _body(),
        buildWhen: (previous, current) =>
            current is PaginateParticipantsState &&
            current.challengeId == _bloc.challengeId,
        bloc: _bloc,
        listener: _listener,
      );
}

class _TitleText extends StatelessWidget {
  final String title;
  final double topPadding;
  final double leftPadding;

  const _TitleText({
    required this.title,
    this.topPadding = 0.0,
    this.leftPadding = 0.0,
  });

  @override
  Widget build(BuildContext context) => SliverPadding(
        padding: EdgeInsets.only(left: leftPadding, top: topPadding),
        sliver: SliverToBoxAdapter(
          child: Text(
            title,
            style: TextStyle(fontSize: 14.0.sp, fontWeight: FontWeight.w700),
          ),
        ),
      );
}

class _ParticipantSectionListView extends StatelessWidget {
  final List<ChallengeParticipant> participantsList;
  final SingleChallengeBloc bloc;

  const _ParticipantSectionListView({
    required this.participantsList,
    required this.bloc,
  });

  @override
  Widget build(BuildContext context) => SliverPadding(
        padding: EdgeInsets.symmetric(
          vertical: 10.0.h,
          horizontal: 8.0.w,
        ),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (participantsList[index].isLoading) {
                return const Text('Loading...');
              }
              return Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: ChallengeParticipantListTile(
                  participantsList[index],
                  bloc: bloc,
                ),
              );
            },
            childCount: participantsList.length,
          ),
        ),
      );
}

class _EmptyParticipantsItem extends StatelessWidget {
  final String title;
  final String subTitle;
  final String btnTitle;
  final VoidCallback onTap;

  const _EmptyParticipantsItem({
    required this.title,
    required this.subTitle,
    required this.btnTitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        sliver: SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color:
                  ChallengesStyles.of(context).leaderboardParticipantTileColor,
              borderRadius: BorderRadius.circular(4),
            ),
            child: ListTile(
              title: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: FontFamily.slussenExtended,
                ),
              ),
              subtitle: Text(
                subTitle,
                style: const TextStyle(
                  color: WildrColors.gray500,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  fontFamily: FontFamily.satoshi,
                ),
              ),
              minLeadingWidth: 0,
              horizontalTitleGap: 0,
              contentPadding: EdgeInsets.zero,
              trailing: SizedBox(
                width: Get.width * 0.3,
                height: 40,
                child: ElevatedButton(
                  onPressed: onTap,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: WildrColors.emerald800,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25.0),
                    ),
                  ),
                  child: Center(child: Text(btnTitle)),
                ),
              ),
            ),
          ),
        ),
      );
}
