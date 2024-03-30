import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CategoryChip extends StatelessWidget {
  final bool selected;
  final ValueSetter<bool> onSelected;
  final String labelText;

  const CategoryChip({
    super.key,
    required this.selected,
    required this.onSelected,
    required this.labelText,
  });

  @override
  Widget build(BuildContext context) => ChoiceChip(
        selected: selected,
        onSelected: onSelected,
        backgroundColor: selected ? WildrColors.primaryColor : Colors.white,
        selectedColor: WildrColors.primaryColor,
        side: BorderSide(
          color: selected ? Colors.transparent : WildrColors.gray500,
        ),
        label: Text(
          labelText,
          style: selected
              ? const TextStyle(color: WildrColors.white)
              : const TextStyle(color: WildrColors.gray700),
        ),
      );
}
