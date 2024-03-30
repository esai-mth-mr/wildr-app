import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class MultiButtonBottomSheetData {
  final Widget leadingIcon;
  final String text;
  final VoidCallback onPressed;

  const MultiButtonBottomSheetData({
    required this.leadingIcon,
    required this.text,
    required this.onPressed,
  });
}

class MultiButtonBottomSheet extends StatelessWidget {
  final List<MultiButtonBottomSheetData> data;

  const MultiButtonBottomSheet(this.data, {super.key});

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.background,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(15),
          topRight: Radius.circular(15),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BottomSheetTopDivider(),
              ...data
                  .map(
                    (e) => Container(
                      margin: const EdgeInsets.only(top: 10),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? WildrColors.darkCardColor
                            : const Color(0xFFEAEAEB),
                        borderRadius: const BorderRadius.all(
                          Radius.circular(15),
                        ),
                      ),
                      child: ListTile(
                        leading: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[e.leadingIcon],
                        ),
                        title: Text(e.text),
                        onTap: e.onPressed,
                      ),
                    ),
                  )
                  .toList(),
            ],
          ),
        ),
      ),
    );
}
