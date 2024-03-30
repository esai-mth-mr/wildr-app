import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class VideoMessageCard extends StatelessWidget {
  const VideoMessageCard({super.key});

  Widget _leadingColorBox() => const ClipRRect(
        borderRadius: BorderRadius.all(Radius.circular(5)),
        child: AspectRatio(
          aspectRatio: 3 / 4,
          child: ColoredBox(color: WildrColors.gray900),
        ),
      );

  Widget _centerTitle(BuildContext context) => Expanded(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _titleText(
              AppLocalizations.of(context)!.challenge_addAVideoMessage,
              context,
              Theme.of(context).textTheme.displaySmall,
            ),
            _titleText(
              '(optional)',
              context,
              Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      );

  Widget _titleText(String title, BuildContext context, TextStyle? style) =>
      Text(
        title,
        style: style,
      );

  Widget _trailing() => const Column(
        children: [
          Icon(
            Icons.edit,
            size: 18,
            color: WildrColors.gray500,
          ),
        ],
      );

  @override
  Widget build(BuildContext context) => Container(
        height: 90,
        padding: const EdgeInsets.all(8.0),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: const BorderRadius.all(Radius.circular(8)),
        ),
        child: Row(
          children: [
            _leadingColorBox(),
            const SizedBox(width: 16),
            _centerTitle(context),
            _trailing(),
          ],
        ),
      );
}
