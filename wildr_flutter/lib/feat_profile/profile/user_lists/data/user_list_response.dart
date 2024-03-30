import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_action.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class UserListResponse {
  final List<WildrUser> users;
  final SmartRefresherAction refresherAction;
  final bool? isSuggestion;

  const UserListResponse({
    required this.users,
    required this.refresherAction,
    this.isSuggestion,
  });
}
