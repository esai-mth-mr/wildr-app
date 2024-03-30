import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DeletedParentRepost extends StatelessWidget {
  const DeletedParentRepost({super.key});

  @override
  Widget build(BuildContext context) => Card(
        color: WildrColors.bannerOrTileBgColor(context),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10.0),
        ),
        child: Container(
          padding: const EdgeInsets.all(8.0),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const WildrIcon(
                  WildrIcons.exclamation_alt_filled,
                  color: Colors.red,
                ),
                Text(
                  AppLocalizations.of(context)!.post_originalPostDeleted,
                  style: const TextStyle(
                    fontSize: 15,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
}
