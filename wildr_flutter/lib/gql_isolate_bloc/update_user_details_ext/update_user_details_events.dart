import 'dart:io';
import 'dart:isolate';

import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class UpdateUserEmailEvent extends MainBlocEvent {
  final String updatedEmail;

  UpdateUserEmailEvent(this.updatedEmail);
}

class UpdateUserNameEvent extends MainBlocEvent {
  final String name;

  UpdateUserNameEvent(this.name);
}

class UpdateUserHandleEvent extends MainBlocEvent {
  final String handle;

  UpdateUserHandleEvent(this.handle);
}

class UpdateUserPhoneNumberEvent extends MainBlocEvent {
  final String phoneNumber;

  UpdateUserPhoneNumberEvent(this.phoneNumber);
}

class UpdateUserAvatarEvent extends MainBlocEvent {
  TransferableTypedData? avatar;
  File? avatarFile;

  UpdateUserAvatarEvent(File? avatar) : avatarFile = avatar {
    if (avatar != null) {
      this.avatar = TransferableTypedData.fromList([avatar.readAsBytesSync()]);
    }
  }
}

class UpdateUserPronounEvent extends MainBlocEvent {
  final String pronoun;

  UpdateUserPronounEvent(this.pronoun);
}

class UpdateUserBioEvent extends MainBlocEvent {
  final String bio;

  UpdateUserBioEvent(this.bio);
}
