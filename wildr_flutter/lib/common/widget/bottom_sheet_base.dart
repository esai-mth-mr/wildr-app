import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class BottomSheetBase extends StatelessWidget {
  const BottomSheetBase({
    super.key,
    required this.child,
    this.heightFactor,
    this.shrinkWrap = false,
  });

  final Widget child;
  final double? heightFactor;
  final bool shrinkWrap;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: FractionallySizedBox(
          heightFactor: shrinkWrap ? null : heightFactor,
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: WildrColors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(10),
                topRight: Radius.circular(10.0),
              ),
            ),
            child: ClipRect(
              child: Column(
                mainAxisSize: shrinkWrap ? MainAxisSize.min : MainAxisSize.max,
                children: [
                  FractionallySizedBox(
                    widthFactor: 0.1,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      height: 4,
                      decoration: const BoxDecoration(
                        color: WildrColors.gray100,
                        borderRadius: BorderRadius.all(Radius.circular(2)),
                      ),
                    ),
                  ),
                  if (shrinkWrap) child else Expanded(child: child),
                ],
              ),
            ),
          ),
        ),
      );
}
