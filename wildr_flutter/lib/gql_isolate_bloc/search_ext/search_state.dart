import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

///Search
class MentionsInputResult extends MainState {
  final String? errorMessage;
  final List<SearchMentionResponse>? response;

  MentionsInputResult({this.errorMessage, this.response = const []}) : super();
}

class TopSearchResultState extends MainState {
  final List<Post>? posts;
  final List<WildrUser>? users;
  final List<Tag>? tags;
  final String? errorMessage;
  late final String query;
  final bool isPaginating;
  final bool isLoading;

  TopSearchResultState({
    this.errorMessage,
    this.posts,
    this.users,
    this.tags,
    required this.query,
    this.isPaginating = false,
    this.isLoading = false,
  });
}

class PostsSearchResultState extends MainState {
  final List<Post>? results;
  final String? errorMessage;
  late final String query;
  final bool isPaginating;
  final bool isLoading;
  final String? singlePageId;

  PostsSearchResultState({
    this.errorMessage,
    this.results,
    required this.query,
    this.isPaginating = false,
    this.isLoading = false,
    this.singlePageId,
  });
}

class UsersSearchResultState extends MainState {
  final List<WildrUser>? results;
  final String? errorMessage;
  late final String query;
  final bool isPaginating;
  final bool isLoading;

  UsersSearchResultState({
    this.errorMessage,
    this.results,
    required this.query,
    this.isPaginating = false,
    this.isLoading = false,
  });
}

class TagsSearchResultState extends MainState {
  final List<Tag>? results;
  final String? errorMessage;
  late final String query;
  final bool isPaginating;
  final bool isLoading;

  TagsSearchResultState({
    this.errorMessage,
    this.results,
    required this.query,
    this.isPaginating = false,
    this.isLoading = false,
  });
}
