import 'package:get_it/get_it.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followers_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followings_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';

final userListLocator = GetIt.instance;

void setupUserListServices(UserListType userListType, String id) {
  switch (userListType) {
    case UserListType.FOLLOWING:
      if (!GetIt.instance.isRegistered<FollowingsHandler>(instanceName: id)) {
        userListLocator.registerLazySingleton<FollowingsHandler>(
          () => FollowingsHandler(),
          instanceName: id,
        );
      }
    case UserListType.FOLLOWERS:
      if (!GetIt.instance.isRegistered<FollowersHandler>(instanceName: id)) {
        userListLocator.registerLazySingleton<FollowersHandler>(
          () => FollowersHandler(),
          instanceName: id,
        );
      }
    case UserListType.INNER_CIRCLE:
      if (!GetIt.instance.isRegistered<InnerCircleHandler>(instanceName: id)) {
        userListLocator.registerLazySingleton<InnerCircleHandler>(
          () => InnerCircleHandler(),
          instanceName: id,
        );
      }
  }
}

void disposeUserListServices(UserListType userListType, String id) {
  switch (userListType) {
    case UserListType.FOLLOWING:
      if (GetIt.instance.isRegistered<FollowingsHandler>(instanceName: id)) {
        userListLocator.unregister<FollowingsHandler>(
          disposingFunction: (handler) => handler.dispose(),
          instanceName: id,
        );
      }
    case UserListType.FOLLOWERS:
      if (GetIt.instance.isRegistered<FollowersHandler>(instanceName: id)) {
        userListLocator.unregister<FollowersHandler>(
          disposingFunction: (handler) => handler.dispose(),
          instanceName: id,
        );
      }
    case UserListType.INNER_CIRCLE:
      if (GetIt.instance.isRegistered<InnerCircleHandler>(instanceName: id)) {
        userListLocator.unregister<InnerCircleHandler>(
          disposingFunction: (handler) => handler.dispose(),
          instanceName: id,
        );
      }
  }
}
