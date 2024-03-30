import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';

class PostType {
  final String name;
  final int value;

  PostType(this.name, this.value);

  WildrIcon logoOutline({double? size}) {
    switch (PostTypeEnum.values[value]) {
      case PostTypeEnum.IMAGE:
        return WildrIcon(
          WildrIcons.photograph_outline,
          size: size,
        );
      case PostTypeEnum.TEXT:
        return WildrIcon(WildrIcons.text_fields_outline, size: size);
      case PostTypeEnum.VIDEO:
        return WildrIcon(WildrIcons.video_camera_outline, size: size);
      case PostTypeEnum.COLLAGE:
        return WildrIcon(WildrIcons.carousel_outline, size: size);
      // ignore: no_default_cases
      default:
        return WildrIcon(WildrIcons.carousel_outline, size: size);
    }
  }

  String getName() => name.toLowerCase().capitalizeFirst ?? name.toLowerCase();

  @override
  String toString() => 'PostType{name: $name, value: $value}';
}

PostTypeEnum getPostTypeEnum(int value) {
  switch (value) {
    case 0:
      return PostTypeEnum.ALL;
    case 1:
      return PostTypeEnum.AUDIO;
    case 2:
      return PostTypeEnum.IMAGE;
    case 3:
      return PostTypeEnum.TEXT;
    case 4:
      return PostTypeEnum.VIDEO;
    case 5:
      return PostTypeEnum.COLLAGE;
    default:
      return PostTypeEnum.ALL;
  }
}

//In sync with server
//Maintain the order
enum PostTypeEnum {
  ALL,
  AUDIO, //NOT USED
  IMAGE,
  TEXT,
  VIDEO,
  COLLAGE,
}
