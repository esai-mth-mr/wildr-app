import 'package:get/get.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/onboarding/data/post_type.dart';

class OnboardingGetXController extends GetxController {
  List<ChallengeCategoryType> postCategoryPreferences = [];
  bool postCategoryPreferencesUpdated = false;
  bool postTypePreferencesUpdated = false;
  List<PostType> postTypePreferences = [];
  bool skipped = false;
}
