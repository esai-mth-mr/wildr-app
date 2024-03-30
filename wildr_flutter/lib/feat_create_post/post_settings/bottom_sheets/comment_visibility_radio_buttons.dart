import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CommentVisibilityRadioButtons extends StatelessWidget {
  final List<CommentVisibilityAccess> commentVisibilityAccess;
  final PostSettingsGxC postSettingsGxC;
  final Function(CommentVisibilityAccess) onChanged;

  const CommentVisibilityRadioButtons(
    this.commentVisibilityAccess, {
    super.key,
    required this.postSettingsGxC,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => StatefulBuilder(
      builder: (context, updateState) => Column(
          children: commentVisibilityAccess.map(
            (e) {
              final isLastItem = commentVisibilityAccess.indexOf(e) ==
                  commentVisibilityAccess.length - 1;
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
                      postSettingsGxC.selectedCommentVisibilityAccess = e;
                      onChanged(e);
                      updateState(() {});
                    },
                    trailing: Checkbox(
                      value:
                          postSettingsGxC.selectedCommentVisibilityAccess == e,
                      onChanged: (value) {
                        postSettingsGxC.selectedCommentVisibilityAccess = e;
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
