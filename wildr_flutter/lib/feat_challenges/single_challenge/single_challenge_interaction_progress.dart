import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class InteractionsProgress extends StatelessWidget {
  final int interactionCount;
  final int totalInteractionCount;

  const InteractionsProgress({
    super.key,
    required this.interactionCount,
    this.totalInteractionCount = 10,
  });

  @override
  Widget build(BuildContext context) => Row(
      children: [
        Text(
          '$interactionCount/$totalInteractionCount',
          style: const TextStyle(
            color: WildrColors.emerald800,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 18,
          width: 18,
          child: CircularProgressIndicator(
            value: interactionCount / totalInteractionCount,
            valueColor: const AlwaysStoppedAnimation(WildrColors.emerald800),
            backgroundColor: Theme.of(context).brightness == Brightness.dark
                ? WildrColors.gray800
                : WildrColors.gray200,
          ),
        ),
      ],
    );
}
