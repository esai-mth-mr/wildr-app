import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility.dart';

class ListVisibility {
  UserListVisibility follower;
  UserListVisibility following;

  ListVisibility({
    required this.follower,
    required this.following,
  });

  Map<String, dynamic> toJson() => {
        'follower': follower.name,
        'following': following.name,
      };

  ListVisibility.fromJson(Map<String, dynamic>? map)
      : follower = toUserListVisibility(map?['follower'] ?? 'EVERYONE'),
        following = toUserListVisibility(map?['following'] ?? 'EVERYONE');

  @override
  String toString() => 'ListVisibility{follower:'
      ' $follower, following: $following}';
}
