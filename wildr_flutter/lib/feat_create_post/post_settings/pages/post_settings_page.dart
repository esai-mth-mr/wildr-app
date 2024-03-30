import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/widgets/post_settings_list.dart';

class PostSettingsPage extends StatefulWidget {
  const PostSettingsPage({super.key});

  @override
  State<PostSettingsPage> createState() => _PostSettingsPageState();
}

class _PostSettingsPageState extends State<PostSettingsPage> {
  late PostSettingsGxC _postSettingsGxC;
  bool _didUpdatePrefs = false;

  @override
  void initState() {
    _postSettingsGxC = Get.put(PostSettingsGxC());
    super.initState();
  }

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          debugPrint('DID update = $_didUpdatePrefs');
          Navigator.pop(context, _didUpdatePrefs);
          return false;
        },
        child: Scaffold(
          appBar: Common().appbarWithActions(
            title: AppLocalizations.of(context)!.createPost_editPostSettings,
          ),
          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: PostSettingsList(
              shouldSavePrefs: true,
              postSettingsGxC: _postSettingsGxC,
              onPrefsUpdate: () {
                _didUpdatePrefs = true;
              },
            ),
          ),
        ),
      );
}
