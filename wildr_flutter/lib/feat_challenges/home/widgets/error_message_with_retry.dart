import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesListErrorMessageWithRetry extends StatelessWidget {
  final String errorMessage;
  final VoidCallback refresh;

  const ChallengesListErrorMessageWithRetry({
    required this.errorMessage,
    required this.refresh,
    super.key,
  });

  @override
  Widget build(BuildContext context) => Container(
      margin: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: errorTileBackgroundColor(context: context),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              errorMessage,
            ),
            IconButton(
              onPressed: refresh,
              icon: const WildrIcon(
                WildrIcons.reloadIcon,
                color: WildrColors.primaryColor,
              ),
            ),
          ],
        ),
      ),
    );

  static Color errorTileBackgroundColor({BuildContext? context}) {
    if (WildrColors.isLightMode(context)) {
      return WildrColors.gray100;
    } else {
      return WildrColors.gray1200;
    }
  }
}
