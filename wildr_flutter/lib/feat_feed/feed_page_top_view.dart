import 'dart:math';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/notification_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

typedef OnFilterPosts = void Function(
  Map<String, dynamic> variables,
  FeedPostType filterEnum,
  FeedScopeType scopeFilterEnum,
);

class FeedPageTopView extends StatefulWidget {
  final FeedGxC feedGxC;
  final OnFilterPosts onFilterPosts;
  final FeedPostType feedPostType;
  final FeedScopeType feedScopeType;
  final bool viewOnlyMode;

  const FeedPageTopView({
    super.key,
    required this.feedGxC,
    required this.onFilterPosts,
    required this.feedPostType,
    required this.feedScopeType,
    this.viewOnlyMode = false,
  });

  @override
  State<FeedPageTopView> createState() => _FeedPageTopViewState();
}

class _FeedPageTopViewState extends State<FeedPageTopView>
    with TickerProviderStateMixin {
  late FeedPostType _feedPostType = widget.feedPostType;
  late FeedScopeType _feedScopeType = widget.feedScopeType;
  TabController? _tabController;
  final List<FeedScopeType> userAccessibleFeeds = [
    FeedScopeType.INNER_CIRCLE_CONSUMPTION,
    FeedScopeType.PERSONALIZED_FOLLOWING,
    FeedScopeType.PERSONALIZED,
  ];
  bool _canSwitchTab = true;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  EdgeInsets get filterSheetContentPadding =>
      const EdgeInsets.only(left: 25, right: 8);

  @override
  void initState() {
    super.initState();
  }

  void _onTabTapped(int index) {
    debugPrint('_onTabTapped: $index');
    FirebaseAnalytics.instance.setCurrentScreen(
      screenName:
          'FeedPageRoute/${userAccessibleFeeds[index].getText(context).replaceAll(' ', '-')}',
    );
    if (!Common().mainBloc(context).networkBloc.isConnected) {
      Common().showErrorSnackBar(kNoInternetError, context);
      _tabController?.animateTo(index == 0 ? 1 : 0);
      return;
    }
    if (_feedScopeType == userAccessibleFeeds[index]) return;
    _feedScopeType = userAccessibleFeeds[index];
    _applyFilters(shouldPop: false);
    _canSwitchTab = false;
  }

  bool _isCurrentTab(FeedScopeType feedScopeType) =>
      userAccessibleFeeds.indexOf(feedScopeType) == _tabController?.index;

  List<Tab> _getTabs() => userAccessibleFeeds
      .map(
        (e) => Tab(
          text: _isCurrentTab(e) ? e.getText(context) : null,
          icon: _isCurrentTab(e) ? null : e.getIcon(),
        ),
      )
      .toList();

  Widget _personalizedFeedTabBar() => AbsorbPointer(
        absorbing: !_canSwitchTab,
        child: Container(
          height: 35,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(100)),
            color: const Color(0x00030903).withOpacity(.24),
          ),
          child: FittedBox(
            child: ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(100)),
              child: TabBar(
                isScrollable: true,
                controller: _tabController,
                onTap: _onTabTapped,
                indicator: BoxDecoration(
                  color: const Color(0xFFF8F8F9).withOpacity(.24),
                  borderRadius: const BorderRadius.all(Radius.circular(100)),
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.normal,
                ),
                labelColor: Colors.white,
                unselectedLabelColor: Colors.grey[100],
                indicatorSize: TabBarIndicatorSize.tab,
                labelStyle: TextStyle(
                  fontSize: 18.0.sp,
                  fontWeight: FontWeight.w600,
                  fontFamily: FontFamily.satoshi,
                ),
                splashFactory: NoSplash.splashFactory,
                indicatorWeight: 1,
                tabs: _getTabs(),
              ),
            ),
          ),
        ),
      );

  Widget _postTypeContainer(FeedPostType feedType, Function updateState) =>
      Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: GestureDetector(
              onTap: () {
                _feedPostType = feedType;
                updateState(() {});
              },
              child: Container(
                height: 70.0.w,
                width: 70.0.w,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.all(Radius.circular(20)),
                  border: _feedPostType == feedType
                      ? null
                      : Border.all(color: Colors.grey),
                  color: _feedPostType == feedType
                      ? WildrColors.primaryColor
                      : Colors.transparent,
                ),
                child: Center(
                  child: feedType.getLogo(
                    color: _feedPostType == feedType ? Colors.white : null,
                  ),
                ),
              ),
            ),
          ),
          Text(feedType.getText(context)),
        ],
      );

  Widget _postTypeFilters(Function updateState) => Column(
        children: [
          const SizedBox(height: 20),
          Text(
            _appLocalizations.feed_postFilter,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 120,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: FeedPostType.values
                  .map((e) => _postTypeContainer(e, updateState))
                  .toList(),
            ),
          ),
        ],
      );

  Widget _applyButton() => Center(
        child: Container(
          padding: const EdgeInsets.only(top: 15, bottom: 5),
          width: Get.width * 0.9,
          child: ElevatedButton(
            style: Common().buttonStyle(),
            onPressed: () {
              _applyFilters();
            },
            child: Text(
              _appLocalizations.feed_apply,
              style: const TextStyle(color: Colors.white, fontSize: 20),
            ),
          ),
        ),
      );

  void _openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, updateState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).padding.bottom,
          ),
          decoration: Common().curveDecoration(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _postTypeFilters(updateState),
              // if (Common().authBloc(context).state.isAuthenticated())
              // _feedScopeFilters(updateState),
              _applyButton(),
            ],
          ),
        ),
      ),
    );
  }

  void _applyFilters({bool shouldPop = true}) {
    if (shouldPop) {
      Navigator.of(context).pop();
    }
    final Map<String, dynamic> variables = {
      'getFeedInput': {
        'feedType': _feedPostType.name,
        'scopeType': _feedScopeType.name,
      },
      'first': 8,
    };
    widget.onFilterPosts(variables, _feedPostType, _feedScopeType);
  }

  Widget _filterButton() => RepaintBoundary(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: GestureDetector(
            onTap: _openFilterSheet,
            child: Container(
              padding: EdgeInsets.all(10.0.w),
              color: const Color(0x40000000),
              child: _feedPostType.getLogo(
                size: 20.0.w,
                color: Colors.white,
              ),
            ),
          ),
        ),
      );

  Widget _body() {
    if (widget.viewOnlyMode) return const SizedBox(width: 1, height: 1);
    final Widget child = Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _filterButton(),
        if (_tabController == null)
          const Spacer()
        else
          _personalizedFeedTabBar(),
        const NotificationCTA(),
      ],
    );
    return child;
  }

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is FeedWidgetChangedState) {
      setState(() {});
    } else if (state is OnFeedScopeTypeChangedState) {
      final int initialIndex =
          max(userAccessibleFeeds.indexOf(state.scopeType), 0);
      if (Common().isLoggedIn(context)) {
        _tabController = TabController(
          length: userAccessibleFeeds.length,
          vsync: this,
          initialIndex: initialIndex,
        );
      } else {
        _tabController = null;
      }
      setState(() {
        _feedPostType = state.postType;
        _feedScopeType = state.scopeType;
      });
    } else if (state is HomeFeedUpdateState) {
      _canSwitchTab = true;
    }
  }

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: _mainBlocListener,
        child: _body(),
      );
}
