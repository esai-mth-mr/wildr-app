import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class Loader {}

class SearchResult {
  WildrUser? user;
  Post? post;
  Tag? tag;
  Loader? loader;

  SearchResult.fromResult(Map<String, dynamic> result) {
    final String typeName = result['__typename'];
    if (typeName == 'User') {
      user = WildrUser.fromUserObj(result);
    } else if (typeName == 'TextPost' ||
        typeName == 'VideoPost' ||
        typeName == 'ImagePost' ||
        typeName == 'MultiMediaPost') {
      post = Post.fromNode(result);
    } else {
      tag = Tag.fromJson(result);
    }
  }

  SearchResult.addLoader() {
    loader = Loader();
  }

// late String id;
// late SearchItemType type;
// String? userName;
// String? userHandle;
// String? userImageUrl;
// String? postThumbUrl;
// String? postBody;
// String? tagName;

// SearchResult.fromJson(Map<String, dynamic> json) {
//   this.id = json['id'];
//   this.type = _getSearchItemTypeFrom(json['type']);

//   this.userName = json['userName'];
//   this.userHandle = json['userHandle'];
//   this.userImageUrl = json['userImageUrl'];

//   this.postThumbUrl = json['postThumbUrl'];
//   this.postBody = json['postBody'];

//   this.tagName = json['tagName'];
// }

// _getSearchItemTypeFrom(String value) {
//   if (value == "USER") {
//     return SearchItemType.USER;
//   } else if (value == "POST") {
//     return SearchItemType.POST;
//   } else {
//     return SearchItemType.TAG;
//   }
// }
}

enum SearchItemType { USER, POST, TAG }

// extension FromValueToSearchItemType on SearchItemType {
//   static SearchItemType from(String value) {
//     if (value == "USER") {
//       return SearchItemType.USER;
//     } else if (value == "POST") {
//       return SearchItemType.POST;
//     } else {
//       return SearchItemType.TAG;
//     }
//   }
// }
