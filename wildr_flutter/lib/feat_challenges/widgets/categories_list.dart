import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/feat_challenges/bloc/challenges_common_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/widgets/category_option_selection.dart';

class CategoriesList extends StatefulWidget {
  /// The list of category ids that should be selected by default.
  final List<ChallengeCategoryType> initialSelectedCategories;

  /// A callback that provides the list of selected category ids every time the
  /// selection changes.
  final void Function(List<ChallengeCategoryType> categories)
      onCategoriesChanged;

  const CategoriesList({
    super.key,
    this.initialSelectedCategories = const [],
    required this.onCategoriesChanged,
  });

  @override
  State<CategoriesList> createState() => _CategoriesListState();
}

class _CategoriesListState extends State<CategoriesList> {
  // Create a copy of the list so that we don't modify the original list.
  late final List<ChallengeCategoryType> _selectedCategories = [
    ...widget.initialSelectedCategories,
  ];

  @override
  void initState() {
    super.initState();

    context
        .read<ChallengesCommonBloc>()
        .add(const ChallengesCommonEvent.getCategories());
  }

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<ChallengesCommonBloc, ChallengesCommonState>(
        builder: (context, state) => state.when(
          initial: () => const SizedBox(),
          categoriesLoading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          categoriesError: (errorMessage) => Center(child: Text(errorMessage)),
          categoriesSuccess: (categories) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: categories
                .map(
                  (category) => Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: CategoryOptionsSection(
                      header: category.name,
                      categoryTypes: category.types,
                      selectedCategories: _selectedCategories,
                      onCategorySelected: (category) {
                        setState(() {
                          _selectedCategories.add(category);
                        });
                        widget.onCategoriesChanged(
                          _selectedCategories,
                        );
                      },
                      onCategoryDeselected: (category) {
                        setState(() {
                          _selectedCategories.removeWhere(
                            (selectedCategory) =>
                                selectedCategory.id == category.id,
                          );
                        });
                        widget.onCategoriesChanged(
                          _selectedCategories,
                        );
                      },
                    ),
                  ),
                )
                .toList(),
          ),
        ),
      );
}

