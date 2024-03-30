import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrCoinIcon extends StatelessWidget {
  const WildrCoinIcon({super.key, required this.size});

  final int size;

  @override
  Widget build(BuildContext context) => Image.asset(
        WildrIconsPng.wildrCoin,
        width: size.toDouble(),
        height: size.toDouble(),
      );
}

TextSpan wildrCoinTextSpan(
  BuildContext context, {
  required int value,
  double? fontAndIconSize,
  bool showWildrCoinName = false,
}) =>
    TextSpan(
      children: [
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: WildrCoinIcon(size: fontAndIconSize?.toInt() ?? 16),
        ),
        const TextSpan(text: ' '),
        TextSpan(
          text: '$value ',
          style: TextStyle(
            fontSize: fontAndIconSize ?? 16,
            fontWeight: FontWeight.w700,
            color: WildrColors.yellow,
          ),
        ),
        if (showWildrCoinName)
          TextSpan(
            text: AppLocalizations.of(context)!.wildrcoin_wildrcoin(value),
            style: TextStyle(
              fontSize: fontAndIconSize ?? 16,
              fontWeight: FontWeight.w700,
              color: WildrColors.yellow,
            ),
          ),
      ],
    );
