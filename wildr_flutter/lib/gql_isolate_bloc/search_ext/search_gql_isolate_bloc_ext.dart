// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_search_explore/search/model/search_result.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[SearchGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [SearchGqlIsolateBlocExt]: $message');
}

extension SearchGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<bool> searchForTopResults(GetTopSearchResultsEvent event) async {
    emit(TopSearchResultState(query: event.query, isLoading: true));
    final QueryResult queryResult = await gService.performQuery(
      SearchQueries().search,
      operationName: QueryOperations.kElasticSearch,
      variables: event.getInput(),
      fetchPolicy: FetchPolicy.cacheAndNetwork,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, queryResult);
    final List<Post> posts = [];
    final List<WildrUser> users = [];
    final List<Tag> tags = [];
    if (errorMessage == null) {
      final Map<String, dynamic>? elasticSearchResult =
          queryResult.data!['elasticSearch'];
      if (elasticSearchResult != null) {
        final res = elasticSearchResult['result'];
        if (res != null) {
          res.forEach((result) {
            final String typeName = result['__typename'];
            if (typeName == 'User') {
              users.add(WildrUser.fromUserObj(result));
            } else if (typeName == 'TextPost' ||
                typeName == 'VideoPost' ||
                typeName == 'ImagePost' ||
                typeName == 'MultiMediaPost') {
              posts.add(Post.fromNode(result));
            } else {
              tags.add(Tag.fromJson(result));
            }
          });
        } else {
          printE('[TopSearchEvent] `res` = null');
        }
      } else {
        printE('[TopSearchEvent] `elasticSearchResult` = null');
      }
    }
    emit(
      TopSearchResultState(
        errorMessage: errorMessage,
        posts: posts,
        users: users,
        tags: tags,
        isPaginating: event.isPaginating,
        query: event.query,
      ),
    );
    return true;
  }

  List<Post> parsePostSearchResults(List data) {
    List<Post> results = [];
    results = [];
    for (final json in data) {
      results.add(Post.fromNode(json));
    }
    return results;
  }

  Future<void> searchForPosts(PostsSearchEvent event) async {
    debugPrint('Search for posts');
    emit(
      PostsSearchResultState(
        query: event.query,
        isLoading: true,
        singlePageId: event.pageId,
      ),
    );
    final QueryResult queryResult = await gService.performQuery(
      SearchQueries().postSearchQuery,
      operationName: QueryOperations.kPostsSearch,
      variables: event.getInput(),
      fetchPolicy: FetchPolicy.noCache,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, queryResult);
    List<Post>? searchResults;
    if (errorMessage == null) {
      final Map<String, dynamic>? elasticSearchResult =
          queryResult.data!['elasticSearch'];
      if (elasticSearchResult != null) {
        final List? res = elasticSearchResult['result'];
        if (res != null) {
          searchResults = parsePostSearchResults(res);
        } else {
          printE('[PostsSearchEvent] `res` = null');
        }
      } else {
        printE('[PostsSearchEvent] `result` = null');
      }
    } else {
      printE('OpenSearch [Error] $errorMessage');
    }
    emit(
      PostsSearchResultState(
        errorMessage: errorMessage,
        results: searchResults,
        isPaginating: event.isPaginating,
        query: event.query,
        singlePageId: event.pageId,
      ),
    );
  }

  List<WildrUser> parseUserSearchResults(List data) {
    List<WildrUser> results = [];
    results = [];
    for (final json in data) {
      results.add(WildrUser.fromUserObj(json));
    }
    return results;
  }

  Future<void> searchForUsers(UsersSearchEvent event) async {
    emit(UsersSearchResultState(query: event.query, isLoading: true));
    final QueryResult queryResult = await gService.performQuery(
      SearchQueries().userSearchQuery,
      operationName: QueryOperations.kUsersSearch,
      fetchPolicy: FetchPolicy.noCache,
      variables: event.getInput(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, queryResult);
    List<WildrUser>? searchResults;
    if (errorMessage == null) {
      final Map<String, dynamic>? elasticSearchResult =
          queryResult.data!['elasticSearch'];
      if (elasticSearchResult != null) {
        final res = elasticSearchResult['result'];
        if (res != null) {
          searchResults = parseUserSearchResults(res);
        } else {
          printE('[PostsSearchEvent] `res` = null');
        }
      } else {
        printE('[PostsSearchEvent] `result` = null');
      }
    }
    emit(
      UsersSearchResultState(
        errorMessage: errorMessage,
        results: searchResults,
        isPaginating: event.isPaginating,
        query: event.query,
      ),
    );
  }

  List<Tag> parseTagsSearchResults(List data) {
    List<Tag> results = [];
    results = [];
    for (final json in data) {
      results.add(Tag.fromJson(json));
    }
    return results;
  }

  Future<void> searchForTags(TagsSearchEvent event) async {
    emit(TagsSearchResultState(query: event.query, isLoading: true));
    final QueryResult queryResult = await gService.performQuery(
      SearchQueries().tagSearch,
      operationName: QueryOperations.kTagsSearch,
      variables: event.getInput(),
      fetchPolicy: FetchPolicy.cacheAndNetwork,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, queryResult);
    List<Tag>? searchResults;
    if (errorMessage == null) {
      final Map<String, dynamic>? elasticSearchResult =
          queryResult.data!['elasticSearch'];
      if (elasticSearchResult != null) {
        final res = elasticSearchResult['result'];
        if (res != null) {
          searchResults = parseTagsSearchResults(res);
        } else {
          printE('[TagsSearchResultEvent] `res` = null');
        }
      } else {
        printE('[TagsSearchEvent] `result` = null');
      }
    }
    emit(
      TagsSearchResultState(
        errorMessage: errorMessage,
        results: searchResults,
        isPaginating: event.isPaginating,
        query: event.query,
      ),
    );
  }

  Future<void> mentionInput(MentionsInputEvent event) async {
    if (currentUser?.isSuspended ?? false) {
      emit(
        MentionsInputResult(
          response: null,
          errorMessage: "Suspended users can't mention anyone",
        ),
      );
      return;
    }
    final QueryResult queryResult = await gService.performQuery(
      SearchQueries().mentionsSearch,
      operationName: QueryOperations.kMentionsSearch,
      variables: event.getInput(),
      fetchPolicy: FetchPolicy.cacheFirst,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, queryResult);
    List<SearchMentionResponse>? mentionResponseList;
    if (errorMessage == null) {
      final Map<String, dynamic>? elasticSearchResult =
          queryResult.data!['elasticSearch'];
      if (elasticSearchResult != null) {
        final res = elasticSearchResult['result'];
        if (res != null) {
          mentionResponseList = [];
          res.forEach((json) {
            // print("JSON = $json");
            final SearchResult result = SearchResult.fromResult(json);
            final SearchMentionResponse response = SearchMentionResponse();
            if (result.user != null) {
              response.user = result.user;
            } else if (result.tag != null) {
              response.tag = result.tag;
            }
            mentionResponseList!.add(response);
          });
        } else {
          printE('[MentionsInputEvent] res = null');
        }
      } else {
        printE('[MentionsInputEvent] result = null');
      }
    }
    emit(
      MentionsInputResult(
        response: mentionResponseList,
        errorMessage: errorMessage,
      ),
    );
  }
}
