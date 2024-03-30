import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SettingsButton extends StatelessWidget {
  const SettingsButton({
    this.shouldShowEditProfile = false,
    this.color = WildrColors.white,
    super.key,
  });

  final bool shouldShowEditProfile;
  final Color color;

  @override
  Widget build(BuildContext context) => IconButton(
        onPressed: () => context.pushRoute(
          SettingsPageRoute(shouldShowEditProfile: shouldShowEditProfile),
        ),
        icon: WildrIcon(WildrIcons.cog_filled, color: color),
        padding: EdgeInsets.zero,
      );
}
