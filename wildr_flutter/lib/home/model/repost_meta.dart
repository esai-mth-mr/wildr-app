import 'package:wildr_flutter/feat_post/model/post.dart';

class RepostMeta {
  Post? parentPost;
  int repostCount = 0;
  List<Post>? repostedPosts;
  RepostedPostsPageInfo? pageInfo;
  bool isParentPostDeleted = false;

  RepostMeta.fromJson(Map<String, dynamic>? map) {
    if (map == null) return;
    if (map['isParentPostDeleted'] == true) {
      isParentPostDeleted = true;
      return;
    }
    if (map['parentPost'] == null) {
      isParentPostDeleted = true;
      return;
    }
    parentPost = Post.fromNode(map['parentPost']);
    repostCount = map['count'] ?? 0;
    _parseRepostedPostsList(map);
  }

  void _parseRepostedPostsList(Map<String, dynamic> map) {
    final Map<String, dynamic>? repostedPostsMap = map['repostedPosts'];
    if (repostedPostsMap == null) return;

    final Map<String, dynamic>? pageInfoMap = map['pageInfo'];
    if (pageInfoMap != null) {
      pageInfo = RepostedPostsPageInfo(pageInfoMap);
    }
    if (repostedPostsMap['edges'] != null) {
      final List edges = repostedPostsMap['edges'] as List;
      repostedPosts = edges.map((e) => Post.fromEdge(e)).toList();
    }
  }
}

class RepostedPostsPageInfo {
  late bool? hasPreviousPage;
  late bool? hasNextPage;
  late String? startCursor;
  late String? endCursor;
  late int? pageNumber;

  RepostedPostsPageInfo(Map<String, dynamic> map) {
    hasPreviousPage = map[hasPreviousPage];
    hasNextPage = map[hasNextPage];
    startCursor = map[startCursor];
    endCursor = map[endCursor];
    pageNumber = map[pageNumber];
  }
}
