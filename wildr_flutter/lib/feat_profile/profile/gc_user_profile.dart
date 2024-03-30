import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/home/model/wildr_user_with_token.dart';

const CURRENT_USER_TAG = 'currentUser';

class CurrentUserProfileGxC extends FeedGxC {
  final Rx<WildrUser> _user = WildrUser.empty().obs;

  WildrUser get user => _user.value;

  set user(WildrUser user) => _user.value = user;

  WildrUser updateUser(WildrUser newUser) => user = user.copy(newUser);

  // JWT token provided by the server running locally for debug purposes
  String? localServerJwtToken;

  UserStats get stats => _user.value.userStats;

  void setUserWithToken(WildrUserWithToken user) {
    this.user = user.user;
    localServerJwtToken = user.token;
  }

  void addPost(Post post, {int? atIndex}) {
    if (atIndex == null) {
      posts.add(post);
    } else {
      posts.insert(atIndex, post);
    }
  }

  void addPosts(List<Post> posts) => this.posts.addAll(posts);

  void removePostAt(int index) => posts.removeAt(index);

  @Deprecated('Usage discouraged')
  void removePost(Post post) => posts.remove(post);

  bool isLoggedIn() => user.id != '';

  var authToken = ''.obs;

  void clear() {
    debugPrint('Clearing UserProfileFeedGxC');
    user = WildrUser.empty();
    posts = [];
    currentPost = Post.empty();
    currentIndex = 0;
    localServerJwtToken = null;
  }
}
