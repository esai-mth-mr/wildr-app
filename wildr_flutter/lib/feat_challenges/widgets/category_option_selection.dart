import 'package:flutter/material.dart';

import 'package:wildr_flutter/feat_challenges/create/widgets/category_chip.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';

class CategoryOptionsSection extends StatelessWidget {
  final String header;
  final List<ChallengeCategoryType> categoryTypes;
  final List<ChallengeCategoryType> selectedCategories;
  final void Function(ChallengeCategoryType categoryId) onCategorySelected;
  final void Function(ChallengeCategoryType categoryId) onCategoryDeselected;

  const CategoryOptionsSection({super.key,
    required this.header,
    required this.categoryTypes,
    required this.selectedCategories,
    required this.onCategorySelected,
    required this.onCategoryDeselected,
  });

  void _onChipSelected({
    required bool selected,
    required ChallengeCategoryType category,
  }) {
    if (selected) {
      onCategoryDeselected(category);
      return;
    }
    onCategorySelected(category);
  }

  @override
  Widget build(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    final sortedCategories = [...categoryTypes]
      ..sort((a, b) => a.value.compareTo(b.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          header,
          style: styles.headline3TextStyle,
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: sortedCategories.map(
            (categoryType) {
              final selected = selectedCategories
                  .map((category) => category.id)
                  .contains(categoryType.id);

              return CategoryChip(
                selected: selected,
                onSelected: (_) => _onChipSelected(
                  selected: selected,
                  category: categoryType,
                ),
                labelText: categoryType.value,
              );
            },
          ).toList(),
        ),
      ],
    );
  }
}
