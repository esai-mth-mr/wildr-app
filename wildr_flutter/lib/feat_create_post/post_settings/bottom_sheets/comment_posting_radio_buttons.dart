import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CommentPostingRadioButtons extends StatelessWidget {
  final List<CommentPostingAccess> commentPostingAccess;
  final PostSettingsGxC postSettingsGxC;
  final Function(CommentPostingAccess) onChanged;

  const CommentPostingRadioButtons(
    this.commentPostingAccess, {
    super.key,
    required this.postSettingsGxC,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => StatefulBuilder(
      builder: (context, updateState) => Column(
          children: commentPostingAccess.map(
            (e) {
              final isLastItem = commentPostingAccess.indexOf(e) ==
                  commentPostingAccess.length - 1;
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
                      postSettingsGxC.selectedCommentPostingAccess = e;
                      onChanged(e);
                      updateState(() {});
                    },
                    trailing: Checkbox(
                      value: postSettingsGxC.selectedCommentPostingAccess == e,
                      onChanged: (value) {
                        postSettingsGxC.selectedCommentPostingAccess = e;
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
