import 'package:wildr_flutter/constants/constants.dart';

class RepostAccessControlContext {
  late bool canRepost;
  late bool hasReposted;
  late String cannotRepostErrorMessage;

  RepostAccessControlContext(Map<String, dynamic> map) {
    canRepost = map['canRepost'] ?? false;
    hasReposted = map['hasReposted'] ?? false;
    cannotRepostErrorMessage =
        map['cannotRepostErrorMessage'] ?? kSomethingWentWrong;
  }
}
