import 'package:wildr_flutter/home/model/wildr_user.dart';

enum ReactionType { REAL, APPLAUD, LIKE }

class ReactionData {
  List<WildrUser> users;
  String endCursor;
  bool isFirstTime;
  int totalCount;

  ReactionData({
    required this.users,
    required this.totalCount,
    required this.endCursor,
    required this.isFirstTime,
  });

  @override
  String toString() => 'ReactionData{users: $users, '
      'endCursor: $endCursor, '
      'isFirstTime: $isFirstTime, totalCount: $totalCount}';
}
