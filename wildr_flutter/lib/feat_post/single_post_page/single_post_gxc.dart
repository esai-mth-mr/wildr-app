import 'package:get/get.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class SinglePostGxC extends FeedGxC {
  final Rx<Post> _currentPost = Post.empty().obs;

  @override
  set currentPost(Post post) {
    _currentPost.value = post;
  }

  @override
  Post get currentPost => _currentPost.value;

  @override
  // ignore: overridden_fields
  var isCaptionExpanded = false.obs;
}
