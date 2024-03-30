import 'dart:convert';

import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class PostSettings {
  String? postVisibilityAccess;
  String? commentVisibilityAccess;
  String? commentPostingAccess;

  PostSettings({
    required this.postVisibilityAccess,
    required this.commentVisibilityAccess,
    required this.commentPostingAccess,
  });

  PostSettings.fromJson(Map<String, dynamic> json) {
    postVisibilityAccess = json['postVisibilityAccess'];
    commentVisibilityAccess = json['commentVisibilityAccess'];
    commentPostingAccess = json['commentPostingAccess'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['postVisibilityAccess'] =
        postVisibilityAccess ?? PostVisibilityAccess.EVERYONE;
    data['commentVisibilityAccess'] =
        commentVisibilityAccess ?? CommentVisibilityAccess.EVERYONE;
    data['commentPostingAccess'] =
        commentPostingAccess ?? CommentPostingAccess.EVERYONE;
    return data;
  }

  @override
  String toString() =>
      'PostSettings{postVisibilityAccess: $postVisibilityAccess,'
      ' commentVisibilityAccess: $commentVisibilityAccess, '
      'commentPostingAccess: $commentPostingAccess}';

  void saveToSharedPreference() {
    final json = jsonEncode(this);
    Prefs.setString(
      PrefKeys.kPostSettings,
      json,
    );
  }
}
