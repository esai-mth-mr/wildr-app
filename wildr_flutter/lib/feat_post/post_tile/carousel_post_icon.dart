import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';

class CarouselIcon extends StatelessWidget {
  final bool isDense;
  const CarouselIcon({super.key, this.isDense = false});

  @override
  Widget build(BuildContext context) => Positioned.fill(
      child: Align(
        alignment: Alignment.topRight,
        child: Padding(
          padding: const EdgeInsets.only(top: 8.0, right: 5),
          child: SizedBox(
            width: isDense ? 14 : 23,
            height: isDense ? 14 : 23,
            child: WildrIcon(
              WildrIcons.carousel_filled,
              size: isDense ? 10 : 15,
            ),
          ),
        ),
      ),
    );
}
