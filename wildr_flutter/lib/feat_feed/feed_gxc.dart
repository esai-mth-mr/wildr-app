import 'package:get/get.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class UserPostModification {
  String key;
  dynamic value;

  UserPostModification({required this.key, required this.value});
}

class FeedGxC extends GetxController {
  /// A map of multi-post postIds to the saved subIndex.
  /// This is used as a "cache" to store the current subIndex of a post so that
  /// when the user navigates back to that post, the subIndex can be restored.
  final multiPostIdToSavedSubIndex = <String, int>{};

  final Rx<Post> _currentPost = Post.empty().obs;
  final RxInt _currentSubIndex = 0.obs;
  final RxInt _currentIndex = 0.obs;
  final RxBool _isMuted = false.obs;
  final RxBool _showMuteStatus = false.obs;
  bool isPaused = false;
  final RxBool isCaptionExpanded = false.obs;
  final _posts = RxList<Post>().obs;
  String pageId = '';
  List<int> subIndexes = [];
  Map<String, List<UserPostModification>> userModification = {};
  String? challengeId;

  List<Post> get posts => _posts.value;

  set currentPost(Post post) {
    _currentPost.value = post;
    _currentSubIndex.value = multiPostIdToSavedSubIndex[currentPost.id] ?? 0;
  }

  Post get currentPost => _currentPost.value;

  void updateCurrentVisiblePost() {
    if (posts.isNotEmpty && currentIndex < posts.length) {
      currentPost = posts[currentIndex];
    } else {
      currentPost = Post.empty();
    }
  }

  int get currentIndex => _currentIndex.value;

  set currentIndex(int value) => _currentIndex.value = value;

  int get currentSubIndex => _currentSubIndex.value;

  set currentSubIndex(int value) {
    multiPostIdToSavedSubIndex[currentPost.id] = value;
    _currentSubIndex.value = value;
  }

  set posts(List<Post> value) {
    posts..clear()
    ..addAll(value);
  }

  bool get isMuted => _isMuted.value;

  set isMuted(bool value) => _isMuted.value = value;

  bool get showMuteStatus => _showMuteStatus.value;

  set showMuteStatus(bool value) => _showMuteStatus.value = value;
}
