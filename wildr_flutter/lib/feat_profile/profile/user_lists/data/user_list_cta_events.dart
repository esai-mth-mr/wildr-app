enum UserListCTAEvent { FOLLOW, UNFOLLOW, REMOVE, ADD }

extension UserListEventExt on UserListCTAEvent {
  String toViewString() {
    switch (this) {
      case UserListCTAEvent.FOLLOW:
        return 'Follow';
      case UserListCTAEvent.UNFOLLOW:
        return 'Unfollow';
      case UserListCTAEvent.REMOVE:
        return 'Remove';
      case UserListCTAEvent.ADD:
        return 'Add';
    }
  }
}
