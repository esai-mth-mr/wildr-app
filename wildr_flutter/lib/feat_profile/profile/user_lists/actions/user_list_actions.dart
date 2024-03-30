import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

abstract class UserListActions {
  final BuildContext context;

  UserListActions(this.context);

  void refresh({String? userId});

  void loadMore({
    required String? endCursor,
    String? userId,
  });

  void action({
    required UserListCTAEvent userListEvents,
    required WildrUser user,
    required WildrUser currentPageUser,
    required int index,
  });
}
