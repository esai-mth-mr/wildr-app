import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SearchAppBar extends StatelessWidget implements PreferredSize {
  final TextEditingController searchController;
  final ValueChanged<String> onChanged;
  final bool showClearButton;
  final VoidCallback toggleSearch;
  final VoidCallback cleatTap;

  const SearchAppBar({
    super.key,
    required this.searchController,
    required this.onChanged,
    required this.showClearButton,
    required this.toggleSearch,
    required this.cleatTap,
  });

  @override
  Widget build(BuildContext context) => AppBar(
      backgroundColor: WildrColors.black,
      elevation: 0,
      leadingWidth: 30.0.w,
      shape: const Border(),
      leading: IconButton(
        onPressed: toggleSearch,
        icon: Icon(
          Icons.arrow_back_ios_new,
          size: 18.0.wh,
          color: WildrColors.white,
        ),
      ),
      title: TextField(
        controller: searchController,
        onChanged: (value) {
          onChanged(value);
        },
        decoration: InputDecoration(
          prefixIcon: Icon(
            Icons.search,
            size: 20.0.wh,
            color: WildrColors.gray400,
          ),
          suffixIcon: Visibility(
            visible: showClearButton,
            child: IconButton(
              icon: WildrIcon(
                WildrIcons.closeIcon,
                size: 15.0.wh,
                color: Colors.white,
              ),
              onPressed: cleatTap,
            ),
          ),
          border: const OutlineInputBorder(
            borderSide: BorderSide(color: WildrColors.gray1000),
          ),
          hintText: 'Search for challenges or creators',
          hintStyle: const TextStyle(color: WildrColors.gray400),
        ),
      ),
    );

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  // TODO: implement child
  Widget get child => throw UnimplementedError();
}
