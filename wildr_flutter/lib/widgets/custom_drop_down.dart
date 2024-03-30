import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CustomDropdown extends StatefulWidget {
  final List<String> items;
  final String selectedItem;
  final ValueChanged<String> onChanged;

  const CustomDropdown({
    super.key,
    required this.items,
    required this.selectedItem,
    required this.onChanged,
  });

  @override
  State<CustomDropdown> createState() => _CustomDropdownState();
}

class _CustomDropdownState extends State<CustomDropdown> {
  bool _isMenuOpen = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
        behavior: HitTestBehavior.translucent,
        onPanDown: (details) {
          setState(() {
            _isMenuOpen = true;
          });
        },
        child: PopupMenuButton<String>(
          offset: const Offset(0, 50),
          color: filterDropdownBGColor(context: context),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
          onSelected: (value) {
            setState(() {
              _isMenuOpen = false;
            });
            widget.onChanged(value);
          },
          onCanceled: () {
            setState(() {
              _isMenuOpen = false;
            });
          },
          itemBuilder: (context) => _popUpItemBuilder(),
          child: _popUpMenuChild(),
        ),
      );

  Widget _popUpMenuChild() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8.0),
          color: filterDropdownBGColor(context: context),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                widget.selectedItem,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14.0.sp,
                ),
              ),
            ),
            WildrIcon(
              _isMenuOpen
                  ? WildrIcons.chevron_up_outline
                  : WildrIcons.chevron_down_outline,
            ),
          ],
        ),
      );

  Color filterDropdownBGColor({BuildContext? context}) =>
      WildrColors.isLightMode(context)
          ? WildrColors.gray100
          : WildrColors.gray1100;

  List<PopupMenuEntry<String>> _popUpItemBuilder() {
    final items = widget.items;
    final selectedItem = widget.selectedItem;

    final List<PopupMenuEntry<String>> menuItems = [];

    for (int i = 0; i < items.length; i++) {
      final item = items[i];

      menuItems.add(
        PopupMenuItem<String>(
          height: Get.height * 0.04,
          value: item,
          child: SizedBox(
            width: Get.width * 0.2,
            child: Text(
              item,
              style: TextStyle(
                fontWeight:
                    item == selectedItem ? FontWeight.w700 : FontWeight.w500,
                fontSize: 14.0.sp,
              ),
            ),
          ),
        ),
      );

      if (i < items.length - 1) {
        menuItems.add(
          const PopupMenuDivider(height: 10),
        );
      }
    }

    return menuItems;
  }
}
