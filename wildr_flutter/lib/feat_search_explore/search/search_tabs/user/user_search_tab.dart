import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/user/search_page_user_tile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';

class UserSearchTab extends StatefulWidget {
  const UserSearchTab({super.key});

  @override
  State<UserSearchTab> createState() => _UserSearchTabState();
}

class _UserSearchTabState extends State<UserSearchTab>
    with AutomaticKeepAliveClientMixin {
  UsersSearchResultState _state =
      UsersSearchResultState(isLoading: true, query: '');

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: (context, state) {
        if (state is UsersSearchResultState) {
          _state = state;
          setState(() {});
        }
      },
      child: _body(),
    );
  }

  int get _usersListCount {
    if (_state.results == null) {
      return 15;
    } else {
      return _state.results!.length;
    }
  }

  Widget _body() {
    if (_state.errorMessage != null) {
      return Container(
        padding: EdgeInsets.only(bottom: Get.height * 0.2),
        child: Center(child: Text(_state.errorMessage!)),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(10),
      itemCount: _usersListCount,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
      ),
      itemBuilder: (context, index) {
        if (_state.isLoading) {
          return Common().wrapInShimmer(
            const ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.white,
              ),
              title: Text('-'),
            ),
          );
        }
        if (index >= _usersListCount) {
          return Container();
        }
        return SearchPageUserTile(
          _state.results![index],
          context,
        );
      },
    );
  }

  @override
  bool get wantKeepAlive => true;
}
