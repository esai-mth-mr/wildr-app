import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/post_tile/loading_post_tile.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page_common.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/user/search_page_user_tile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';

class TopSearchTab extends StatefulWidget {
  const TopSearchTab({super.key});

  @override
  State<TopSearchTab> createState() => _TopSearchTabState();
}

class _TopSearchTabState extends State<TopSearchTab>
    with AutomaticKeepAliveClientMixin {
  TopSearchResultState _state =
      TopSearchResultState(isLoading: true, query: '');

  int get _usersListCount {
    if (_state.users == null) {
      return 5;
    } else {
      return _state.users!.length;
    }
  }

  Widget _usersHorizontalList() => SizedBox(
      height: _screenSize.height * 0.20,
      child: ListView.builder(
        shrinkWrap: true,
        scrollDirection: Axis.horizontal,
        itemCount: _usersListCount,
        // itemCount: 10,
        itemBuilder: (context, index) => SizedBox(
            width: _screenSize.width * 0.3,
            height: 120,
            // child: SearchPageCommon.loadingUserTile()
            child: _state.users == null
                ? const SearchPageLoadingUserTile()
                : SearchPageUserTile(_state.users![index], context),
          ),
      ),
    );

  int get _postsListCount {
    if (_state.posts == null) {
      return 10;
    } else {
      return _state.posts!.length;
    }
  }

  Widget _postsHorizontalList() => SizedBox(
      height: _screenSize.height * 0.50,
      child: GridView.builder(
        shrinkWrap: true,
        scrollDirection: Axis.horizontal,
        itemCount: _postsListCount,
        // itemCount: 10,
        itemBuilder: (context, index) => SizedBox(
            width: _screenSize.width * 0.3,
            child: _state.posts == null
                ? const LoadingPostTile()
                : SearchPageCommon.postTile(_state.posts![index], context),
          ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          // mainAxisExtent: _screenSize.width * 0.4,
        ),
      ),
    );

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: (context, state) {
        if (state is TopSearchResultState) {
          _state = state;
          setState(() {});
        }
      },
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 28,
          top: 10,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const ListTile(
              title: Text('Users'),
            ),
            _usersHorizontalList(),
            const ListTile(
              title: Text('Posts'),
            ),
            Expanded(child: _postsHorizontalList()),
          ],
        ),
      ),
    );
  }

  Size get _screenSize => MediaQuery.of(context).size;

  @override
  bool get wantKeepAlive => true;
}
