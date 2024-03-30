import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/svg.dart';
import 'package:get/get.dart';
import 'package:overlay_tooltip/overlay_tooltip.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenge_home_state.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_bloc.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/challenge_card.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/challenge_shimmer_card.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/error_message_with_retry.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/intro_overlay_card.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/my_challenge_card.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/my_challenge_shimmer_card.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class _AllChallengesSliverGrid extends StatelessWidget {
  final List<Challenge> list;
  final bool isPaginating;
  final bool isShimmer;
  final VoidCallback paginate;

  const _AllChallengesSliverGrid(
    this.list, {
    this.isPaginating = false,
    this.isShimmer = false,
    required this.paginate,
  });

  Widget _shimmerGrid() => SliverPadding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 16.0,
            crossAxisSpacing: 12.0,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) => const ChallengeShimmerCard(dense: true),
            childCount: 6,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    if (isShimmer) return _shimmerGrid();
    return SliverPadding(
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16.0,
          crossAxisSpacing: 12.0,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final challenge = list[index];
            if (index == list.length - 3) {
              paginate();
            }
            return ChallengeCard(
              challenge: challenge,
              dense: true,
              onTap: () {
                Common().mainBloc(context).logCustomEvent(
                  ChallengesAnalyticsEvents.kTapAllChallengeCard,
                  {
                    ChallengesAnalyticsParameters.kChallengeId: challenge.id,
                  },
                );
                context.pushRoute(
                  SingleChallengePageRoute(
                    challengeId: challenge.id,
                  ),
                );
              },
            );
          },
          childCount: list.length,
        ),
      ),
    );
  }
}

class _MyChallengesHorizontalList extends StatelessWidget {
  final List<Challenge> list;
  final bool isPaginating;
  final bool isShimmer;
  final VoidCallback paginate;

  const _MyChallengesHorizontalList(
    this.list, {
    this.isPaginating = false,
    this.isShimmer = false,
    required this.paginate,
  });

  Widget _shimmerList() => ListView.separated(
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        itemBuilder: (context, index) => SizedBox(
          width: MediaQuery.of(context).size.width / 2.5,
          child: const MyChallengeShimmerCard(),
        ),
      );

  Widget _emptyListView(BuildContext context) => Container(
        padding: const EdgeInsets.all(15),
        decoration: const BoxDecoration(
          borderRadius: BorderRadius.all(Radius.circular(15)),
        ),
        child: Stack(
          children: <Widget>[
            SvgPicture.asset(
              Theme.of(context).brightness == Brightness.light
                  ? 'assets/images/my_challenges_empty_light.svg'
                  : 'assets/images/my_challenges_empty_dark.svg',
              fit: BoxFit.fill,
              width: double.infinity,
              height: double.infinity,
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      AppLocalizations.of(context)!
                          .challenge_meaningfulActionPrompt,
                      style: TextStyle(
                        fontSize: 18.0.sp,
                        color: WildrColors.textColorStrong(context),
                        fontFamily: FontFamily.slussenExpanded,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      AppLocalizations.of(context)!.challenge_joinOrStart,
                      style: TextStyle(
                        color: WildrColors.textColorStrong(context),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    PrimaryCta(
                      text: AppLocalizations.of(context)!
                          .challenge_createAChallenge,
                      onPressed: () {
                        context
                            .read<MainBloc>()
                            .add(InitCreateChallengeEvent());
                      },
                      width: Get.width * 0.5,
                      filled: true,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    if (isShimmer) return _shimmerList();
    if (list.isEmpty) return _emptyListView(context);
    return ListView.separated(
      separatorBuilder: (context, index) => const SizedBox(width: 12),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      scrollDirection: Axis.horizontal,
      itemCount: isPaginating ? list.length + 1 : list.length,
      itemBuilder: (context, index) {
        if (index == list.length) {
          return const _Loader();
        }
        if (index == list.length - 3) paginate();
        final challenge = list[index];
        return SizedBox(
          width: MediaQuery.of(context).size.width / 2.5,
          child: MyChallengeCard(
            challenge: challenge,
            onTap: () {
              Common().mainBloc(context).logCustomEvent(
                ChallengesAnalyticsEvents.kTapMyChallengeCard,
                {
                  ChallengesAnalyticsParameters.kChallengeId: challenge.id,
                },
              );

              context.pushRoute(
                SingleChallengePageRoute(challengeId: challenge.id),
              );
            },
          ),
        );
      },
    );
  }
}

class _FeaturedChallengesHorizontalList extends StatelessWidget {
  final List<Challenge> list;
  final bool isPaginating;
  final bool isShimmer;
  final VoidCallback paginate;

  const _FeaturedChallengesHorizontalList(
    this.list, {
    this.isPaginating = false,
    this.isShimmer = false,
    required this.paginate,
  });

  Widget _challengeCard(Challenge challenge, BuildContext context) => SizedBox(
        width: Get.width * 0.7,
        child: ChallengeCard(
          challenge: challenge,
          onTap: () {
            Common().mainBloc(context).logCustomEvent(
              ChallengesAnalyticsEvents.kTapFeaturedChallengeCard,
              {
                ChallengesAnalyticsParameters.kChallengeId: challenge.id,
              },
            );

            context.pushRoute(
              SingleChallengePageRoute(challengeId: challenge.id),
            );
          },
        ),
      );

  ListView _shimmerList() => ListView.separated(
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        itemBuilder: (context, index) => SizedBox(
          width: Get.width * 0.7,
          child: const ChallengeShimmerCard(),
        ),
      );

  @override
  Widget build(BuildContext context) {
    if (isShimmer) return _shimmerList();
    return ListView.separated(
      separatorBuilder: (context, index) => const SizedBox(width: 12),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      scrollDirection: Axis.horizontal,
      itemCount: isPaginating ? list.length + 1 : list.length,
      itemBuilder: (context, index) {
        if (index == list.length) {
          return const _Loader();
        }
        if (index == list.length - 3) paginate();
        final challenge = list[index];
        return _challengeCard(challenge, context);
      },
    );
  }
}

class ChallengesCardsView extends StatefulWidget {
  final ChallengesListType type;

  const ChallengesCardsView(this.type, {super.key});

  @override
  State<ChallengesCardsView> createState() => _ChallengesCardsViewState();
}

class _ChallengesCardsViewState extends State<ChallengesCardsView>
    with AutomaticKeepAliveClientMixin {
  List<Challenge> _list = [];
  late PaginateChallengesState state =
      PaginateChallengesState.globalShimmer(type: widget.type);

  bool get _isPaginating => state.isPaginating;

  @override
  void initState() {
    super.initState();
    _paginate(shouldRefresh: true, shouldShowShimmer: true);
  }

  void _refresh() {
    _paginate(shouldRefresh: true);
  }

  void _paginate({bool shouldRefresh = false, bool shouldShowShimmer = false}) {
    if (!state.canPaginate) {
      return;
    }
    final String? endCursor = shouldRefresh ? null : state.afterCursor;
    switch (state.type) {
      case ChallengesListType.GLOBAL:
        // Ignore this case.
        break;
      case ChallengesListType.MY_CHALLENGES:
        if (Common().mainBloc(context).isLoggedIn) {
          context.read<ChallengesMainBloc>().add(
                GetMyChallengesEvent(
                  after: endCursor,
                  shouldTriggerShimmer: shouldShowShimmer,
                ),
              );
        }
      case ChallengesListType.FEATURED:
        context.read<ChallengesMainBloc>().add(
              GetFeaturedChallengesEvent(
                after: endCursor,
                shouldTriggerShimmer: shouldShowShimmer,
              ),
            );
      case ChallengesListType.ALL:
      case ChallengesListType.ALL_PAST:
      case ChallengesListType.ALL_ACTIVE:
        context.read<ChallengesMainBloc>().add(
              GetAllChallengesEvent(
                type: state.type,
                after: endCursor,
                shouldTriggerShimmer: shouldShowShimmer,
              ),
            );
    }
  }

  SliverToBoxAdapter _errorMessageBody() => SliverToBoxAdapter(
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.20,
          child: ChallengesListErrorMessageWithRetry(
            errorMessage: state.errorMessage ?? kSomethingWentWrong,
            refresh: _refresh,
          ),
        ),
      );

  Widget _sliverBody() {
    switch (state.type) {
      case ChallengesListType.GLOBAL:
        return _errorMessageBody();
      case ChallengesListType.MY_CHALLENGES:
        return SliverToBoxAdapter(
          child: SizedBox(
            height: MediaQuery.of(context).size.height / 3,
            child: _MyChallengesHorizontalList(
              _list,
              paginate: _paginate,
              isPaginating: _isPaginating,
              isShimmer: state.isShimmering,
            ),
          ),
        );
      case ChallengesListType.FEATURED:
        return SliverToBoxAdapter(
          child: OverlayTooltipItem(
            displayIndex: 0,
            tooltip: (controller) => IntroOverlayCard(
              title: AppLocalizations.of(context)!
                  .challenge_featuredChallengesWithStar,
              description:
                  AppLocalizations.of(context)!.challenge_topChallengesPrompt,
              arrowOnLeft: true,
              arrowOnTop: true,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: Common().challengeHeadingPadding(),
                  child: Text(
                    AppLocalizations.of(context)!.challenge_featuredChallenges,
                    style: ChallengesStyles.of(context).headline1TextStyle,
                  ),
                ),
                SizedBox(
                  height: MediaQuery.of(context).size.height / 3,
                  child: _FeaturedChallengesHorizontalList(
                    _list,
                    paginate: _paginate,
                    isPaginating: _isPaginating,
                    isShimmer: state.isShimmering,
                  ),
                ),
              ],
            ),
          ),
        );
      case ChallengesListType.ALL:
      case ChallengesListType.ALL_ACTIVE:
      case ChallengesListType.ALL_PAST:
        return _AllChallengesSliverGrid(
          _list,
          paginate: _paginate,
          isPaginating: _isPaginating,
          isShimmer: state.isShimmering,
        );
    }
  }

  Widget _body() {
    if (state.errorMessage != null) return _errorMessageBody();
    return _sliverBody();
  }

  void _listener(BuildContext context, PaginateChallengesState state) {
    if (state.type != widget.type) return;
    final oldState = this.state;
    this.state = state;
    if (state.paginationState == PaginationState.DONE_REFRESHING) {
      _list = state.list ?? [];
    } else if (oldState.isPaginating &&
        state.paginationState == PaginationState.DONE_PAGINATING) {
      _list.addAll(state.list ?? []);
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<ChallengesMainBloc, PaginateChallengesState>(
      listener: _listener,
      child: _body(),
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class _Loader extends StatelessWidget {
  const _Loader();

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: CircularProgressIndicator(),
        ),
      );
}

void print(dynamic message) {
  debugPrint('[ChallengesCardsView]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengesCardsView]: $message');
}
