import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_post/post_reactions_list/reaction_list_data.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reaction_list_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reactions_list_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';

void print(dynamic message) {
  debugPrint('Reactions List Tab: $message');
}

const NUMBER_OF_REACTIONS_TO_FETCH = 10;

class ReactionsListTab extends StatefulWidget {
  const ReactionsListTab({
    super.key,
    required this.reactionType,
    required this.postId,
  });
  final ReactionType reactionType;
  final String postId;

  @override
  State<ReactionsListTab> createState() => _ReactionsListTabState();
}

class _ReactionsListTabState extends State<ReactionsListTab>
    with AutomaticKeepAliveClientMixin<ReactionsListTab> {
  final ReactionData _reactionData = ReactionData(
    totalCount: 0,
    users: [],
    endCursor: '',
    isFirstTime: true,
  );
  late RefreshController _refreshController;
  bool _initialLoading = true;

  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  @override
  void initState() {
    super.initState();
    _refreshController = RefreshController();
    _getData();
  }

  Future<void> _getData([bool next = false]) async {
    // if (widget.reactionType == ReactionType.REAL) {
    //   Common().mainBloc(context).add(
    //     PaginateRealReactorsListEvent(
    //       fetchCount: NUMBER_OF_REACTIONS_TO_FETCH,
    //       postId: widget.postId,
    //       after: next ? _reactionData.endCursor : null,
    //     ),
    //   );
    // }
    if (widget.reactionType == ReactionType.LIKE) {
      Common().mainBloc(context).add(
            PaginateLikeReactorsListEvent(
              fetchCount: NUMBER_OF_REACTIONS_TO_FETCH,
              postId: widget.postId,
              after: next ? _reactionData.endCursor : null,
            ),
          );
    }
    // else if (widget.reactionType == ReactionType.APPLAUD) {
    //   Common().mainBloc(context).add(
    //     PaginateApplaudReactorsListEvent(
    //       fetchCount: NUMBER_OF_REACTIONS_TO_FETCH,
    //       postId: widget.postId,
    //       after: next ? _reactionData.endCursor : null,
    //     ),
    //   );
    // }
  }

  ListTile _listTile(int index, WildrUser user, BuildContext context) =>
      ListTile(
        contentPadding:
            const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        leading: Common().avatarFromUser(context, user),
        title: Text(
          user.handle,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onTap: () {
          Common().openProfilePage(
            context,
            user.id,
            shouldNavigateToCurrentUser: false,
            user: user,
          );
        },
      );

  void updateData(state) {
    if (state.errorMessage != null) {
      Common().showErrorSnackBar(state.errorMessage!, context);
      if (_refreshController.isRefresh) {
        _refreshController.refreshFailed();
      } else if (_refreshController.isLoading) {
        _refreshController.loadFailed();
      }
    } else {
      debugPrint(state.endCursor);
      if (state.endCursor == null || state.totalCount == null) {
        return;
      }
      _reactionData.users.addAll(state.users!);
      _reactionData.isFirstTime = false;
      if (_refreshController.isRefresh) {
        _reactionData..totalCount = state.totalCount
        ..endCursor = state.endCursor
        ..users = state.users!;
        _refreshController.refreshCompleted();
      } else if (_refreshController.isLoading) {
        _reactionData.endCursor = state.endCursor;
        if (state.users!.length == 0) {
          _refreshController.loadNoData();
        } else {
          _refreshController.loadComplete();
        }
      }
      _initialLoading = false;
    }
    setState(() {});
  }

  Widget emptyReactions() => Center(
        // shrinkWrap: true,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const WildrIcon(
              WildrIcons.image_search_filled,
              size: 80,
              color: Colors.grey,
            ),
            Text(
              _appLocalizations.post_noReactions,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: (context, state) {
        // if (state is PaginateRealReactorsListState &&
        //     widget.reactionType == ReactionType.REAL) {
        //   updateData(state);
        // }
        if (state is PaginateLikeReactorsListState &&
            widget.reactionType == ReactionType.LIKE) {
          updateData(state);
        }
        // if (state is PaginateApplaudReactorsListState &&
        //     widget.reactionType == ReactionType.APPLAUD) {
        //   updateData(state);
        // }
      },
      child: SmartRefresher(
        controller: _refreshController,
        onRefresh: () => _getData(),
        onLoading: () => _getData(true),
        enablePullUp: true,
        header: Common().defaultClassicHeader,
        footer: createEmptyPaginationFooter(),
        child: _initialLoading
            ? const Center(child: CircularProgressIndicator())
            : _reactionData.users.isEmpty
                ? emptyReactions()
                : ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: _reactionData.users.length,
                    itemBuilder: (context, index) => _listTile(
                        index,
                        _reactionData.users[index],
                        context,
                      ),

                  ),
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;
}
