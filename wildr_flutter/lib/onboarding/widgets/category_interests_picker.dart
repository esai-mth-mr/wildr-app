import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/widgets/category_option_selection.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_getx_controller.dart';

class CategoryInterestsPicker extends StatefulWidget {
  final List<ChallengeCategory> categories;
  final List<ChallengeCategoryType>? previousUserCategories;
  final VoidCallback onSelectionChanged;

  const CategoryInterestsPicker({
    super.key,
    required this.categories,
    required this.previousUserCategories,
    required this.onSelectionChanged,
  });

  @override
  State<CategoryInterestsPicker> createState() =>
      _CategoryInterestsPickerState();
}

class _CategoryInterestsPickerState extends State<CategoryInterestsPicker> {
  late OnboardingGetXController _onboardingGetXController;
  final int maxSelection = 4;

  late List<ChallengeCategory> _categories;

  @override
  void initState() {
    _onboardingGetXController = Get.find();
    _onboardingGetXController.postCategoryPreferences =
        widget.previousUserCategories ?? [];
    if (mounted) setState(() {});
    _categories = widget.categories;
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10.0),
        child: ListView(
          children: _categories
              .map(
                (category) => categoryInterestListItem(category),
              )
              .toList(),
        ),
      );

  Widget categoryInterestListItem(ChallengeCategory category) => Padding(
        padding: const EdgeInsets.only(bottom: 24),
        child: CategoryOptionsSection(
          header: category.name,
          categoryTypes: category.types,
          selectedCategories: _onboardingGetXController.postCategoryPreferences,
          onCategorySelected: (category) {
            onCategorySelected(category);
          },
          onCategoryDeselected: (category) {
            onCategoryDeselected(category);
          },
        ),
      );

  void onCategorySelected(ChallengeCategoryType category) {
    setState(() {
      _onboardingGetXController.postCategoryPreferences.add(category);
    });
    widget.onSelectionChanged();
  }

  void onCategoryDeselected(ChallengeCategoryType category) {
    setState(() {
      _onboardingGetXController.postCategoryPreferences.removeWhere(
        (element) => element.value == category.value,
      );
    });
    widget.onSelectionChanged();
  }
}
