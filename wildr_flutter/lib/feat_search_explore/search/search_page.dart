import 'package:debounce_throttle/debounce_throttle.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_search_explore/sd_search_box.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/post/post_search_tab.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/tags/tag_search_tab.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_tabs/user/user_search_tab.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[SearchPage] $message');
}

const TOP_PAGE_INDEX = -1;
const POSTS_PAGE_INDEX = 0;
const USERS_PAGE_INDEX = 1;
const TAGS_PAGE_INDEX = 2;

class SearchPage extends StatefulWidget {
  final bool shouldShowBackButton;
  final String? tagSearch;
  final int? goToIndex;

  const SearchPage({
    super.key,
    this.shouldShowBackButton = true,
    this.tagSearch,
    this.goToIndex,
  }) : assert(
          goToIndex == null ||
              (goToIndex <= TAGS_PAGE_INDEX && goToIndex >= TOP_PAGE_INDEX),
        );

  @override
  SearchPageState createState() => SearchPageState();
}

class SearchPageState extends State<SearchPage>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  final List<Tab> _tabs = [
    // Tab(text: "Top"),
    const Tab(text: 'Posts'),
    const Tab(text: 'Users'),
    const Tab(text: 'Tags'),
  ];
  late TextEditingController _textEditingController;
  late final TabController _tabController =
      TabController(length: _tabs.length, vsync: this);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final _debouncer =
      Debouncer<String>(const Duration(milliseconds: 500), initialValue: '');
  late final FocusNode _searchFocusNode = FocusNode();
  String _placeholderText = 'Search for posts';

  String? _postsPageSearchText;
  String? _usersPageSearchText;
  String? _tagsPageSearchText;

  @override
  void initState() {
    print('InitState');
    _textEditingController = TextEditingController();
    super.initState();
    _textEditingController.addListener(
      () => _debouncer.value = _textEditingController.text,
    );
    _tabController.addListener(_onTabChanged);
    _debouncer.values.listen((search) => _submitSearch(search));
    _handleIntent();
  }

  void _submitSearch(String text) {
    if (_tabController.index == TOP_PAGE_INDEX) {
      Common().mainBloc(context).add(GetTopSearchResultsEvent(text));
    } else if (_tabController.index == USERS_PAGE_INDEX) {
      if (_usersPageSearchText == text) {
        return;
      }
      _usersPageSearchText = text;
      Common().mainBloc(context).add(UsersSearchEvent(text));
    } else if (_tabController.index == TAGS_PAGE_INDEX) {
      if (_tagsPageSearchText == text) {
        return;
      }
      _tagsPageSearchText = text;
      Common().mainBloc(context).add(TagsSearchEvent(text));
    } else if (_tabController.index == POSTS_PAGE_INDEX) {
      if (_postsPageSearchText == text) {
        debugPrint('EFFICIENCY POSTS');
        return;
      }
      _postsPageSearchText = text;
      debugPrint('SEARCHING POSTS');
      Common().mainBloc(context).add(PostsSearchEvent(text));
    }
    setState(() {});
  }

  void _onTabChanged() {
    FirebaseAnalytics.instance.setCurrentScreen(
      screenName: '${SearchPageRoute.name}/${_tabs[_tabController.index].text}',
    );

    if (_tabController.index == TOP_PAGE_INDEX) {
      _placeholderText = _appLocalizations.search_explore_cap_search;
    } else if (_tabController.index == USERS_PAGE_INDEX) {
      _placeholderText = _appLocalizations.search_explore_cap_searchForUsers;
    } else if (_tabController.index == TAGS_PAGE_INDEX) {
      _placeholderText = _appLocalizations.search_explore_cap_searchForTags;
    } else if (_tabController.index == POSTS_PAGE_INDEX) {
      _placeholderText = _appLocalizations.search_explore_cap_searchForPosts;
    }
    setState(() {});
    _submitSearch(_textEditingController.text);
  }

  void _handleIntent() {
    if (widget.tagSearch != null) {
      _tabController.index = TAGS_PAGE_INDEX;
      final String tagToSearch = widget.tagSearch!.trim();
      _textEditingController.text = tagToSearch;
      setState(() {});
      Common().mainBloc(context).add(TagsSearchEvent(tagToSearch));
    } else if (widget.goToIndex != null) {
      _tabController.index = widget.goToIndex!;
      setState(() {});
    }
  }

  Widget _searchBox() => Hero(
        tag: 'D&S_SearchTextField',
        child: Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: SDSearchBox(
            controller: _textEditingController,
            placeholder: _placeholderText,
            focusNode: _searchFocusNode,
          ),
        ),
      );

  ///Build()
  AppBar _appBar(BuildContext context) => AppBar(
        centerTitle: true,
        backgroundColor: Theme.of(context).colorScheme.background,
        title: _searchBox(),
        bottom: _tabBar,
      );

  Color get _smartColor => Theme.of(context).brightness == Brightness.dark
      ? Colors.white70
      : Colors.black54;

  TabBar get _tabBar => TabBar(
        labelPadding: EdgeInsets.zero,
        controller: _tabController,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal),
        labelColor: WildrColors.primaryColor,
        unselectedLabelColor: _smartColor,
        indicatorColor: WildrColors.primaryColor,
        tabs: _tabs,
      );

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: _appBar(context),
      body: TabBarView(
        controller: _tabController,
        children: const [
          // TopSearchTab(),
          PostSearchTab(),
          UserSearchTab(),
          TagSearchTab(),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _textEditingController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;
}
