// ignore_for_file: avoid_positional_boolean_parameters

import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SearchMentionResponse {
  Widget avatar(
    BuildContext context,
    double radius,
    bool shouldShowRing, {
    bool shouldNavigateToProfile = false,
  }) {
    if (user != null) {
      return Common().avatarFromUser(
        context,
        user!,
        radius: radius,
        shouldShowRing: shouldShowRing,
        shouldNavigateToProfile: shouldNavigateToProfile,
      );
    } else {
      return CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: radius,
        child: const Text('#', style: TextStyle(color: Colors.white)),
      );
    }
  }

  String displayText() {
    if (user != null) {
      return user!.handle;
    } else {
      return tag!.name;
    }
  }

  String id() {
    if (user != null) {
      return user!.id;
    } else {
      return tag!.id;
    }
  }

  String firstLabel() {
    if (user != null) {
      return user!.handle;
    } else {
      return tag!.name;
    }
  }

  String? secondLabel() {
    if (user != null) {
      if (user!.name?.isNotEmpty ?? false) {
        return user!.name;
      }
    } else {
      return null;
    }
    return null;
  }

  Author? author;
  WildrUser? user;
  Tag? tag;
}

class Tag {
  late String id;
  late String name;

  Tag.fromJson(Map<String, dynamic> json) {
    id = json['id'] ?? 'NO_ID';
    name = json['name'] ?? kNA;
  }
}
