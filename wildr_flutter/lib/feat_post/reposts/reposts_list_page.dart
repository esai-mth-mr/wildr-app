import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/buttons/wildr_outline_button.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('RepostsListPage: $message');
}

class RepostsListPage extends StatefulWidget {
  final Post parentPost;

  const RepostsListPage(this.parentPost, {super.key});

  @override
  State<RepostsListPage> createState() => _RepostsListPageState();
}

class _RepostsListPageState extends State<RepostsListPage> {
  List<Post> _reposts = [];
  late RefreshController _refreshController;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Post get _parentPost => widget.parentPost;
  bool? _isFetching;

  @override
  void initState() {
    _refreshController = RefreshController();
    _fetch();
    super.initState();
  }

  Widget _trailingButton(String repostId) => SizedBox(
        height: 30,
        child: WildrOutlineButton(
          text: _appLocalizations.post_cap_view,
          width: 60,
          onPressed: () {
            _openRepostPost(repostId);
          },
        ),
      );

  Widget _postLeading(Post? post) {
    post?.subPosts = _parentPost.subPosts;
    return SizedBox(
      height: 55,
      width: 45,
      child: Common().postListTileIcon(post, context),
    );
  }

  void _openRepostPost(String id) {
    context.pushRoute(SinglePostPageRoute(postId: id));
  }

  Widget _repostListTile(Post repost) => GestureDetector(
        onTap: () {
          _openRepostPost(repost.id);
        },
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: [
              _postLeading(repost),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (repost.bodyText != null)
                      Text(
                        repost.bodyText!,
                        style: const TextStyle(fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    TextButton(
                      onPressed: () {
                        Common().openProfilePage(
                          context,
                          repost.author.id,
                          author: repost.author,
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(50, 10),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        alignment: Alignment.centerLeft,
                      ),
                      child: Text(
                        '@${repost.author.handle}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: WildrColors.textColorStrong(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              _trailingButton(repost.id),
            ],
          ),
        ),
      );

  Widget _postsListView() {
    if (_isFetching ?? true) {
      return const Center(child: CircularProgressIndicator());
    }
    if (!(_isFetching ?? true) && _reposts.isEmpty) {
      return _noPostsFoundMessage();
    }
    return ListView.builder(
      itemCount: _reposts.length,
      itemBuilder: (context, index) => _repostListTile(_reposts[index]),
    );
  }

  Widget _noPostsFoundMessage() => Container(
        height: MediaQuery.of(context).size.height,
        width: MediaQuery.of(context).size.width,
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.top * 4,
        ), //To account for the appbar
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const WildrIcon(
              WildrIcons.image_search_filled,
              size: 80,
            ),
            Text(
              _appLocalizations.post_noRepostsYet,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );

  SmartRefresher _repostsList() => SmartRefresher(
        controller: _refreshController,
        onRefresh: _onRefresh,
        onLoading: _onLoadMore,
        enablePullUp: true,
        physics: _isFetching ?? true
            ? const NeverScrollableScrollPhysics()
            : const AlwaysScrollableScrollPhysics(),
        footer: createEmptyPaginationFooter(),
        child: _postsListView(),
      );

  Widget _titleMessage() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Text.rich(
          TextSpan(
            style:
                TextStyle(color: WildrColors.textColorStrong(), fontSize: 16),
            children: [
              TextSpan(text: _appLocalizations.createPost_originalPostBy),
              TextSpan(
                text: '@${_parentPost.author.handle}',
                recognizer: TapGestureRecognizer()
                  ..onTap = () => Common().openProfilePage(
                        context,
                        _parentPost.author.id,
                        author: _parentPost.author,
                      ),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      );

  Widget _body() => SizedBox(
        height: MediaQuery.of(context).size.height,
        child: Column(
          children: [
            _titleMessage(),
            Expanded(
              child: _repostsList(),
            ),
          ],
        ),
      );

  void _fetch({String? after}) {
    _isFetching = true;
    Common().mainBloc(context).add(
          PaginateRepostedPostsEvent(
            _parentPost.id,
            after: after,
          ),
        );
  }

  void _onRefresh() {
    _fetch();
  }

  void _onLoadMore() {
    _fetch(after: _reposts.last.id);
  }

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is PaginateRepostedPostsState) {
      _isFetching = false;
      if (state.isSuccessful) {
        if (_refreshController.isLoading) {
          final posts = state.posts;
          if (posts == null) {
            _refreshController.loadFailed();
            return;
          }
          if (posts.isEmpty) {
            _refreshController.loadNoData();
          } else {
            _refreshController.loadComplete();
          }
          _reposts.addAll(posts);
        } else {
          _reposts = state.posts ?? [];
          _refreshController.refreshCompleted();
        }
      } else {
        _refreshController
          ..refreshCompleted()
          ..loadFailed();
        Common().showErrorSnackBar(
          state.errorMessage ?? kSomethingWentWrong,
          context,
        );
      }
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(_appLocalizations.post_cap_reposts)),
        body: BlocListener<MainBloc, MainState>(
          listener: _mainBlocListener,
          child: _body(),
        ),
      );
}
