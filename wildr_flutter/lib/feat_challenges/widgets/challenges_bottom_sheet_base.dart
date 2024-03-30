import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesBottomSheetBase extends StatelessWidget {
  final Widget child;
  final double? heightFactor;
  final bool shrinkWrap;

  const ChallengesBottomSheetBase({
    super.key,
    required this.child,
    this.heightFactor,
    this.shrinkWrap = false,
  });

  Widget _fractionallySizedBox() => FractionallySizedBox(
      widthFactor: 0.1,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        height: 4,
        decoration: const BoxDecoration(
          color: WildrColors.gray900,
          borderRadius: BorderRadius.all(Radius.circular(2)),
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => SafeArea(
      child: FractionallySizedBox(
        heightFactor: shrinkWrap ? null : heightFactor,
        child: Column(
          mainAxisSize: shrinkWrap ? MainAxisSize.min : MainAxisSize.max,
          children: [
            _fractionallySizedBox(),
            if (shrinkWrap) child else Expanded(child: child),
          ],
        ),
      ),
    );
}
