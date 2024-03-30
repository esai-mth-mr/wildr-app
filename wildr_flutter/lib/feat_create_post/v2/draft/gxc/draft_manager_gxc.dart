import 'dart:convert';

import 'package:get/get.dart';
import 'package:helpers/helpers.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/post_draft_setting.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class DraftManagerGxC extends GetxController {
  final _drafts = <PostSettingsDraft>[].obs;
  List<PostSettingsDraft> get drafts => _drafts.toList();

  @override
  void onInit() {
    super.onInit();
    _loadDraftsFromPrefs();
  }

  Future<void> _loadDraftsFromPrefs() async {
    final List<String>? draftJsonList =
        Prefs.getStringList(PrefKeys.kPostDraftsKey);
    if (draftJsonList != null) {
      final drafts = draftJsonList
          .map((json) => PostSettingsDraft.fromJson(jsonDecode(json)))
          .toList();
      _drafts.assignAll(drafts);
    }
  }

  Future<void> saveDraft(PostSettingsDraft draft) async {
    final index = _drafts.indexWhere((d) => d.postsData == draft.postsData);

    if (index != -1) {
      _drafts[index] = draft;
    } else {
      _drafts.add(draft);
    }
    final draftJsonList =
        _drafts.map((draft) => jsonEncode(draft.toJson())).toList();
    await Prefs.setStringList('kPostDraftsKey', draftJsonList);
  }

  Future<void> deleteDraft(PostSettingsDraft draft) async {
    _drafts.remove(draft);

    final draftJsonList =
        _drafts.map((draft) => jsonEncode(draft.toJson())).toList();
    await Prefs.setStringList('kPostDraftsKey', draftJsonList);
  }

  Future<void> deleteDrafts(List<PostSettingsDraft> draftsToDelete) async {
    _drafts.removeAll(draftsToDelete);

    final draftJsonList =
        _drafts.map((draft) => jsonEncode(draft.toJson())).toList();
    await Prefs.setStringList('kPostDraftsKey', draftJsonList);
  }
}
