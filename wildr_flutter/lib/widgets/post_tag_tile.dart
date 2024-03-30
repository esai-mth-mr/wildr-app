import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class RepostTagTile extends StatelessWidget {
  const RepostTagTile({super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 8.0, bottom: 8.0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: WildrColors.gray900.withOpacity(0.75),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const WildrIcon(
                WildrIcons.repost,
                size: 14,
                color: WildrColors.white,
              ),
              const SizedBox(width: 4),
              Text(
                AppLocalizations.of(context)!.createPost_cap_repost,
                style: const TextStyle(
                  color: WildrColors.white,
                  fontFamily: FontFamily.satoshi,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      );
}
