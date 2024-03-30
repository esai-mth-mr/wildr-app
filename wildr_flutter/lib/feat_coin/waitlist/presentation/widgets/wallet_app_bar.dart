import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WalletAppBar extends StatelessWidget implements PreferredSizeWidget {
  const WalletAppBar({
    super.key,
    required this.onInfoTap,
    required this.onSettingsTap,
    required this.onNotificationsTap,
  });

  final VoidCallback onInfoTap;
  final VoidCallback onSettingsTap;
  final VoidCallback onNotificationsTap;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  static const BoxConstraints _defaultIconsConstraints = BoxConstraints(
    minWidth: 40,
    minHeight: 40,
  );

  @override
  Widget build(BuildContext context) => AppBar(
        centerTitle: true,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              AppLocalizations.of(context)!.wildrcoin_dashboard_wallet,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: FontFamily.satoshi,
                color: WildrColors.black,
              ),
            ),
            IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(
                minWidth: 26,
                minHeight: 26,
              ),
              icon: const WildrIcon(
                WildrIcons.info_outline,
                size: 18,
                color: WildrColors.gray500,
              ),
              onPressed: onInfoTap,
            ),
          ],
        ),
        actions: [
          IconButton(
            constraints: _defaultIconsConstraints,
            icon: const WildrIcon(
              WildrIcons.cog_outline,
              size: 18,
            ),
            onPressed: onSettingsTap,
          ),
          IconButton(
            padding: const EdgeInsets.only(right: 4),
            constraints: _defaultIconsConstraints,
            icon: const WildrIcon(
              WildrIcons.bell_filled,
              size: 18,
            ),
            onPressed: onNotificationsTap,
          ),
        ],
      );
}
