import 'package:flutter/widgets.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';

class WildrCoinIcon extends StatelessWidget {
  const WildrCoinIcon({super.key, this.size});

  final double? size;

  @override
  Widget build(BuildContext context) => WildrIcon(
      WildrIcons.wildrCoinIcon,
      size: size ?? 14,
    );
}
