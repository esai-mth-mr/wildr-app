import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostVisibilityRadioButtons extends StatelessWidget {
  final List<PostVisibilityAccess> postVisibilityAccess;
  final PostSettingsGxC postSettingsGxC;
  final Function(PostVisibilityAccess) onChanged;

  const PostVisibilityRadioButtons(
    this.postVisibilityAccess, {
    super.key,
    required this.postSettingsGxC,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => StatefulBuilder(
      builder: (context, updateState) => Column(
          children: postVisibilityAccess.map(
            (e) {
              final isLastItem = postVisibilityAccess.indexOf(e) ==
                  postVisibilityAccess.length - 1;
              return Column(
                children: [
                  ListTile(
                    shape: const Border(),
                    tileColor: Colors.transparent,
                    dense: true,
                    title: Text(
                      e.toViewString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    onTap: () {
                      postSettingsGxC.selectedPostVisibilityAccess = e;
                      onChanged(e);
                      updateState(() {});
                    },
                    trailing: Checkbox(
                      value: postSettingsGxC.selectedPostVisibilityAccess == e,
                      onChanged: (value) {
                        postSettingsGxC.selectedPostVisibilityAccess = e;
                        onChanged(e);
                        updateState(() {});
                      },
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                      activeColor: WildrColors.primaryColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  if (isLastItem) const SizedBox() else const Divider(),
                ],
              );
            },
          ).toList(),
        ),
    );
}
