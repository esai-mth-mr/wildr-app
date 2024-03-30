import 'package:align_positioned/align_positioned.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_getx_controller.dart';
import 'package:wildr_flutter/onboarding/data/post_type.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostTypeInterestsPicker extends StatefulWidget {
  final List<PostType> postTypes;
  final List<PostType>? previousPostTypes;

  const PostTypeInterestsPicker({
    super.key,
    required this.previousPostTypes,
    required this.postTypes,
  });

  @override
  State<PostTypeInterestsPicker> createState() =>
      _PostTypeInterestsPickerState();
}

class _PostTypeInterestsPickerState extends State<PostTypeInterestsPicker> {
  late final List<PostType> _postTypes = widget.postTypes;
  late OnboardingGetXController _onboardingGetXController;

  @override
  void initState() {
    _onboardingGetXController = Get.find();
    _onboardingGetXController.postTypePreferences =
        widget.previousPostTypes ?? [];
    if (mounted) setState(() {});
    super.initState();
  }

  Widget _selectedBubble(PostType postType) => GestureDetector(
      onTap: () {
        debugPrint('here $postType');
        setState(
          () => _onboardingGetXController.postTypePreferences.removeWhere(
            (element) => element.value == postType.value,
          ),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AlignPositioned.relative(
            container: _bubbleChild(true, postType),
            child: GestureDetector(
              onTap: () => setState(
                () => _onboardingGetXController.postTypePreferences.removeWhere(
                  (element) => element.value == postType.value,
                ),
              ),
              child: AbsorbPointer(
                child: Container(
                  height: 30.0.w,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(
                      width: 5,
                      color: WildrColors.primaryColor,
                    ),
                  ),
                  child: const Center(
                    child: WildrIcon(
                      WildrIcons.x_outline,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ),
            moveByChildWidth: 0.42,
            moveByChildHeight: -2,
          ),
          const SizedBox(height: 10),
          Text(
            postType.getName(),
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
          ),
        ],
      ),
    );

  Widget _bubbleChild(bool isSelected, PostType postType) => Container(
      height: 130.0.w,
      width: 130.0.w,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        color: isSelected ? WildrColors.primaryColor : null,
        border: isSelected ? null : Border.all(color: Colors.grey),
      ),
      child: Center(child: postType.logoOutline(size: 50)),
    );

  Widget _unselectedBubble(PostType postType) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: () {
            setState(
              () => _onboardingGetXController.postTypePreferences.add(postType),
            );
          },
          child: _bubbleChild(false, postType),
        ),
        const SizedBox(height: 10),
        Text(
          postType.getName(),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
      ],
    );

  Widget _getSelection(PostType postType) {
    final PostType? selected = _onboardingGetXController.postTypePreferences
        .firstWhereOrNull((e) => postType.value == e.value);
    return selected == null
        ? _unselectedBubble(postType)
        : _selectedBubble(postType);
  }

  @override
  Widget build(BuildContext context) => Center(
      child: GridView(
        padding: const EdgeInsets.all(20),
        //physics: NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          //  crossAxisSpacing: 20,
          mainAxisSpacing: 20,
        ),
        children: _postTypes
            .map(
              (e) => _getSelection(e),
            )
            .toList(),
      ),
    );
}
