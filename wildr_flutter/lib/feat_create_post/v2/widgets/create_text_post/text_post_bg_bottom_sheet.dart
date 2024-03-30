import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/gxc/text_post_background_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/create_text_post/cover_image_or_gradient.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/create_text_post/selected_background_preview.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/custom_color_picker.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class TextPostSelectBGBottomSheet extends StatefulWidget {
  const TextPostSelectBGBottomSheet({super.key});

  @override
  State<TextPostSelectBGBottomSheet> createState() =>
      _TextPostSelectBGBottomSheetState();
}

class _TextPostSelectBGBottomSheetState
    extends State<TextPostSelectBGBottomSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  int? _selectedColorGradientIndex;
  final TextPostBackgroundGxc _textPostBackgroundGxc =
      Get.put(TextPostBackgroundGxc());

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  void _onGradientSelected(int index) {
    _textPostBackgroundGxc.textPostCustomBGColor = Colors.transparent;
    setState(() {
      if (_selectedColorGradientIndex == index) {
        _selectedColorGradientIndex = null;
        _textPostBackgroundGxc.clear();
        return;
      }
      _selectedColorGradientIndex = index;
    });
    _textPostBackgroundGxc
      ..textPostBGColorGradient =
          colorGradientPresets[_selectedColorGradientIndex!]
      ..textPostBGEnum = TextPostBackgroundType.GRADIENT;
  }

  Widget _topBarRow() => Row(
        children: [
          const WildrIcon(
            WildrIcons.alignmentIcon,
            color: Colors.white,
            size: 24,
          ),
          SizedBox(width: 15.0.w),
          Obx(
            () => SelectedBackgroundPreview(
              colorGradient: _textPostBackgroundGxc.textPostBGColorGradient,
              backgroundColor: _textPostBackgroundGxc.textPostCustomBGColor,
            ),
          ),
        ],
      );

  Widget _tabBar() => TabBar(
        indicatorColor: WildrColors.gray1100,
        controller: _tabController,
        labelColor: WildrColors.white,
        unselectedLabelColor: Colors.grey,
        indicatorSize: TabBarIndicatorSize.tab,
        isScrollable: true,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(30.0),
          color: WildrColors.gray1100,
        ),
        onTap: (index) {},
        tabs: [
          SizedBox(
            width: Get.width * 0.3,
            height: Get.height * 0.04,
            child: Tab(
              text: AppLocalizations.of(context)!.createPost_library,
            ),
          ),
          SizedBox(
            width: Get.width * 0.3,
            height: Get.height * 0.04,
            child: Tab(
              text: AppLocalizations.of(context)!.createPost_custom,
            ),
          ),
        ],
      );

  Widget _tabBarView() => TabBarView(
        controller: _tabController,
        children: [
          Center(
            child: _PresetGradientOptionsGrid(
              gradients: colorGradientPresets,
              currentGradientIndex: _selectedColorGradientIndex,
              onGradientSelected: _onGradientSelected,
            ),
          ),
          const ColorPicker(320),
        ],
      );

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(left: 16.0.w, bottom: 16.0.h, right: 16.0.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: Get.height * 0.05,
              alignment: Alignment.centerLeft,
              width: double.infinity,
              color: WildrColors.gray1200,
              child: _topBarRow(),
            ),
            _tabBar(),
            SizedBox(
              height: Get.height * 0.26,
              child: _tabBarView(),
            ),
          ],
        ),
      );
}

class _PresetGradientOptionsGrid extends StatelessWidget {
  final List<List<Color>> gradients;
  final int? currentGradientIndex;
  final ValueSetter<int> onGradientSelected;

  const _PresetGradientOptionsGrid({
    required this.gradients,
    required this.currentGradientIndex,
    required this.onGradientSelected,
  });

  @override
  Widget build(BuildContext context) => GridView.count(
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        crossAxisCount: 4,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: gradients
            .mapIndexed(
              (index, colors) => GestureDetector(
                onTap: () => onGradientSelected(index),
                child: CoverImageOrGradient(
                  colorGradient: colors,
                  isBordered: currentGradientIndex == index,
                  isRounded: true,
                ),
              ),
            )
            .toList(),
      );
}
