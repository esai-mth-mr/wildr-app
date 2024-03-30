import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/tags/search_page_tag_tile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';

class TagSearchTab extends StatefulWidget {
  const TagSearchTab({super.key});

  @override
  State<TagSearchTab> createState() => _TagSearchTabState();
}

class _TagSearchTabState extends State<TagSearchTab>
    with AutomaticKeepAliveClientMixin {
  TagsSearchResultState _state =
      TagsSearchResultState(isLoading: true, query: '');

  int get _tagsListCount {
    if (_state.results == null) {
      return 5;
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
    return ListView.builder(
      padding: const EdgeInsets.all(10),
      itemCount: _tagsListCount,
      itemBuilder: (context, index) {
        if (_state.isLoading) {
          return Common().wrapInShimmer(
            const ListTile(
              leading: CircleAvatar(backgroundColor: Colors.white),
              title: Text('-'),
            ),
          );
        }
        if (index >= _state.results!.length) {
          return Container();
        }
        return SearchPageTagTile(_state.results![index]);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: (context, state) {
        if (state is TagsSearchResultState) {
          _state = state;
          if (mounted) setState(() {});
        }
      },
      child: _body(),
    );
  }

  @override
  bool get wantKeepAlive => true;
}
