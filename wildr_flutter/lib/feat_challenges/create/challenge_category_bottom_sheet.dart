import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/create_challenge_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/widgets/categories_list.dart';

class ChallengeCategoryBottomSheet extends StatefulWidget {
  final List<ChallengeCategoryType> initialSelectedCategories;
  final ValueSetter<List<ChallengeCategoryType>> onCategoriesSaved;

  const ChallengeCategoryBottomSheet({
    super.key,
    required this.initialSelectedCategories,
    required this.onCategoriesSaved,
  });

  @override
  State<ChallengeCategoryBottomSheet> createState() =>
      _ChallengeCategoryBottomSheetState();
}

class _ChallengeCategoryBottomSheetState
    extends State<ChallengeCategoryBottomSheet> {
  late List<ChallengeCategoryType> _selectedCategories = [
    ...widget.initialSelectedCategories,
  ];
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  bool hasEdited = false;
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) => CreateChallengeBottomSheet(
        title: _appLocalizations.challenge_chooseCategories,
        subtitle: _appLocalizations.challenge_discoveryTagging,
        heightFactor: 0.9,
        onSave: () => widget.onCategoriesSaved(_selectedCategories),
        hasEdited: hasEdited,
        child: CategoriesList(
          initialSelectedCategories: widget.initialSelectedCategories,
          onCategoriesChanged: (categories) {
            _selectedCategories = categories;

            setState(() {
              hasEdited = !_areCategoriesEqual(
                widget.initialSelectedCategories,
                _selectedCategories,
              );
            });
          },
        ),
      );

  bool _areCategoriesEqual(
    List<ChallengeCategoryType> previous,
    List<ChallengeCategoryType> current,
  ) {
    if (previous.length != current.length) {
      return false;
    }
    final previousIds = previous.map((e) => e.id).toSet();
    final currentIds = current.map((e) => e.id).toSet();
    return previousIds.difference(currentIds).isEmpty &&
        currentIds.difference(previousIds).isEmpty;
  }
}
