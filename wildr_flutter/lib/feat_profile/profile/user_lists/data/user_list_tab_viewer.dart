import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';

class UserListTabViewer {
  UserListType type;
  bool isDisabled;

  UserListTabViewer(this.type, {this.isDisabled = false});
}
