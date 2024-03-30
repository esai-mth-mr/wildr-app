import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/post/post_search_tab.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';

class SearchSingleTagPage extends StatefulWidget {
  final String tagName;

  const SearchSingleTagPage({required this.tagName, super.key});

  @override
  State<SearchSingleTagPage> createState() => _SearchSingleTagPageState();
}

class _SearchSingleTagPageState extends State<SearchSingleTagPage> {
  late final String id = const Uuid().v4();

  @override
  void initState() {
    super.initState();
    Common()
        .mainBloc(context)
        .add(PostsSearchEvent('#${widget.tagName}', pageId: id));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(
        title: Text(widget.tagName),
      ),
      body: PostSearchTab(
        key: ValueKey(id),
        pageId: id,
      ),
    );
}
