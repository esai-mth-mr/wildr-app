import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

enum PostOverlayType { NONE, NSFW, POST_TO_VIEW }

extension ParseFeedOverlay on PostOverlayType {
  Widget getWidget({double? size, Color color = WildrColors.gray300}) {
    switch (this) {
      case PostOverlayType.NONE:
        return Container();
      case PostOverlayType.NSFW:
      case PostOverlayType.POST_TO_VIEW:
        return WildrIcon(
          WildrIcons.eye_off_outline,
          size: size ?? Get.width * 0.15,
          color: color,
        );
    }
  }

  String getTitle(BuildContext context) {
    switch (this) {
      case PostOverlayType.NONE:
        return '';
      case PostOverlayType.NSFW:
        return AppLocalizations.of(context)!.post_contentWarning;
      case PostOverlayType.POST_TO_VIEW:
        return AppLocalizations.of(context)!.post_postToView;
    }
  }

  String getDescription(BuildContext context) {
    switch (this) {
      case PostOverlayType.NONE:
      case PostOverlayType.POST_TO_VIEW:
        return '';
      case PostOverlayType.NSFW:
        return AppLocalizations.of(context)!
            .post_sensitiveContentWarningMessage;
    }
  }
}
