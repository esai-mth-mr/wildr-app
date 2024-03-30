import 'package:get/get.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

@Deprecated('No longer using it')
class CurrentUserProfileGxC extends GetxController {
  //region User
  final Rx<WildrUser> _user = WildrUser.empty().obs;

  WildrUser get user => _user.value;

  set user(WildrUser user) => _user.value = user;

  UserStats get stats => _user.value.userStats;

  //endregion

  //region Posts and Feed
  final _posts = RxList<Post>().obs;

  List<Post>? get userPosts => _posts.value;

  set userPosts(List<Post>? posts) {
    posts?.clear();
    posts?.addAll(posts);
  }

  void addPost(Post post, {int? atIndex}) {
    userPosts ??= [];
    if (atIndex == null) {
      userPosts!.add(post);
    } else {
      userPosts!.insert(atIndex, post);
    }
  }

  void addPosts(List<Post> posts) {
    userPosts ??= [];
    userPosts!.addAll(posts);
  }

  void removePostAt(int index) {
    if (userPosts == null) {
      return;
    }
    userPosts!.removeAt(index);
  }

  @Deprecated('Usage discouraged')
  void removePost(Post post) {
    if (userPosts == null) {
      return;
    }
    userPosts!.remove(post);
  }

  final Rx<Post> _currentPost = Post.empty().obs;

  set currentPost(Post post) {
    _currentPost.value = post;
  }

  Post get currentPost => _currentPost.value;

  final _isCaptionExpanded = false.obs;

  bool get isCaptionExpanded => _isCaptionExpanded.value;

  set isCaptionExpanded(bool value) => _isCaptionExpanded.value = value;

  final _currentIndex = 0.obs;

  int get currentIndex => _currentIndex.value;

  set currentIndex(int value) => _currentIndex.value = value;
//endregion
}
