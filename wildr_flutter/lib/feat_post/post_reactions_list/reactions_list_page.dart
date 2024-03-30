// ignore_for_file: lines_longer_than_80_chars

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/svg.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_navigation/src/extension_navigation.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_reactions_list/reaction_list_data.dart';
import 'package:wildr_flutter/feat_post/post_reactions_list/reactions_list_tab.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reaction_list_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reactions_list_state.dart';

void print(dynamic message) {
  debugPrint('ReactionListPage: $message');
}

class ReactionListPage extends StatefulWidget {
  final Post post;

  const ReactionListPage(this.post, {super.key});

  @override
  State<ReactionListPage> createState() => _ReactionListPageState();
}

class _ReactionListPageState extends State<ReactionListPage>
    with SingleTickerProviderStateMixin {
  ReactionType _reactionType = ReactionType.LIKE;
  late TabController _tabController;
  late Map<ReactionType, int> _totalCounts;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _tabController = TabController(length: tabData.length, vsync: this);
    _totalCounts = {
      //ReactionType.REAL: widget.post.stats.realCount,
      // ReactionType.APPLAUD: widget.post.stats.applauseCount,
      ReactionType.LIKE: widget.post.stats.likeCount,
    };
    _tabController.addListener(() {
      setState(() {
        _reactionType =
            tabData[_tabController.index]['reactionType']! as ReactionType;
      });
    });
    getData();
    super.initState();
  }

  void getData() {
    if (mounted) {
      Common()
          .mainBloc(context)
          .add(LikeReactorsCountEvent(postId: widget.post.id));
    }
  }

  final tabData = [
    // {
    //   "icon": 'assets/icon/reaction_real.svg',
    //   "color": AppColors.primaryColor,
    //   "reactionType": ReactionType.REAL
    // },
    // {
    //   "icon": 'assets/icon/reaction_applaud.svg',
    //   "color": AppColors.applaudColor,
    //   "reactionType": ReactionType.APPLAUD
    // },
    {
      'icon': 'assets/icon/reaction_like.svg',
      'color': Colors.red,
      'reactionType': ReactionType.LIKE,
    },
  ];

  Widget reactionTypeButtons(
    String iconPath,
    String number,
    Color color,
    ReactionType reactionType,
  ) =>
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            alignment: Alignment.center,
            height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _reactionType == reactionType
                  ? color
                  : Colors.white24, // <-- Button color
            ),
            child: SvgPicture.asset(
              iconPath,
              colorFilter: ColorFilter.mode(
                _reactionType == reactionType
                    ? Colors.white
                    : Get.theme.brightness == Brightness.dark
                        ? Colors.white
                        : Colors.black54,
                BlendMode.srcIn,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(5.0),
            child: Text(number),
          ),
        ],
      );

  void updateData(reactionType, state) {
    if (state.errorMessage != null) {
      Common().showErrorSnackBar(state._errorMessage!, context);
    } else {
      setState(() {
        _totalCounts[reactionType] = state.totalCount;
      });
    }
  }

  @override
  Widget build(BuildContext context) => StatefulBuilder(
        builder: (context, updateState) => Container(
          height: Get.height,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.background,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(15),
              topRight: Radius.circular(15),
            ),
          ),
          child: SafeArea(
            child: DefaultTabController(
              length: tabData.length,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Common().bottomSheetDragger(),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _appLocalizations.post_likes,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 25,
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          icon: const WildrIcon(WildrIcons.x_circle_filled),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Text(
                          '${_totalCounts[ReactionType.LIKE]} ${_totalCounts[ReactionType.LIKE] == 1 ? _appLocalizations.post_like : _appLocalizations.post_likes}',
                          style: const TextStyle(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  const SizedBox(height: 10),
                  // TabBar(
                  //   controller: _tabController,
                  //   onTap: (int index) {
                  //     updateState(() {
                  //       _reactionType =
                  //           tabData[index]['reactionType'] as ReactionType;
                  //     });
                  //   },
                  //   tabs: tabData.map((i) {
                  //     return Padding(
                  //       padding: EdgeInsets.all(5),
                  //       child: reactionTypeButtons(
                  //         i['icon']! as String,
                  //         _totalCounts[i['reactionType']].toString(),
                  //         i['color']! as Color,
                  //         i['reactionType'] as ReactionType,
                  //       ),
                  //     );
                  //   }).toList(),
                  // ),
                  Flexible(
                    child: BlocListener<MainBloc, MainState>(
                      bloc: Common().mainBloc(context),
                      listener: (context, state) {
                        // if (state is RealReactorsCountState) {
                        //   updateData(ReactionType.REAL, state);
                        // }
                        // if (state is ApplaudReactorsCountState) {
                        //   updateData(ReactionType.APPLAUD, state);
                        // }
                        if (state is LikeReactorsCountState) {
                          updateData(ReactionType.LIKE, state);
                        }
                      },
                      child: TabBarView(
                        controller: _tabController,
                        physics: const BouncingScrollPhysics(),
                        children: tabData
                            .map(
                              (r) => ReactionsListTab(
                                postId: widget.post.id,
                                reactionType: r['reactionType']! as ReactionType,
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}
