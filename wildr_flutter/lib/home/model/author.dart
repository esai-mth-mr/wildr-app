import 'package:wildr_flutter/home/model/wildr_user.dart';

class Author extends WildrUser {
  int currentStrikeCount = 0;
  bool isFaded = false;

  set isInInnerCircle(bool value) {
    currentUserContext ??= CurrentUserContext();
    currentUserContext!.isInnerCircle = true;
  }

  Author.fromJson(Map<String, dynamic> map) : super.fromJson(map) {
    final Map<String, dynamic>? strikeData = map['strikeData'];
    if (strikeData != null) {
      isFaded = strikeData['isFaded'] ?? false;
      currentStrikeCount = strikeData['currentStrikeCount'] ?? 0;
    }
  }

  Author.placeholder() : super.empty();

  @override
  Map<String, dynamic> toJson() => {
      'id': id,
      'handle': handle,
      'name': name,
      'email': email,
      'avatarImage': avatarImage?.toJson(),
    };

  Author.empty() : super.empty();
}

class AvatarImage {
  String? url;

  Map<String, dynamic> toJson() => {'uri': url};

  AvatarImage.fromJson(Map<String, dynamic>? map) {
    if (map == null) {
      return;
    }
    url = map['uri'];
    if (url?.isEmpty ?? true) {
      url = null;
    }
  }

  @override
  String toString() => 'AvatarImage: url = $url';

  AvatarImage.empty() {
    url = null;
  }
}
