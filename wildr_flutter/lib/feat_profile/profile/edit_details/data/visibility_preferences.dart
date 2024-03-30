import 'package:wildr_flutter/feat_profile/profile/edit_details/data/list_visibility.dart';

class VisibilityPreferences {
  ListVisibility list;

  VisibilityPreferences({required this.list});

  Map<String, dynamic> toJson() => {
      'list': list.toJson(),
    };

  @override
  String toString() => toJson().toString();

  VisibilityPreferences.fromJson(Map<String, dynamic>? map)
      : list = ListVisibility.fromJson(map?['list']);
}
