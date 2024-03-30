import 'dart:convert';

import 'package:azlistview/azlistview.dart';

class ContactInfo extends ISuspensionBean {
  String name;
  String tag;
  String phone;
  String? img;
  String id;

  ContactInfo({
    required this.id,
    required this.name,
    required this.phone,
    this.img,
  }) : tag = _toTag(name);

  ContactInfo.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        name = json['name'],
        img = json['img'],
        phone = json['phone'],
        tag = _toTag(json['name']);

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'img': img,
      };

  static String _toTag(String name) => name.isNotEmpty
        ? RegExp('[A-Z]').hasMatch(name.substring(0, 1).toUpperCase())
            ? name.substring(0, 1).toUpperCase()
            : '#'
        : '#';

  @override
  String getSuspensionTag() => tag;

  @override
  String toString() => json.encode(this);
}
