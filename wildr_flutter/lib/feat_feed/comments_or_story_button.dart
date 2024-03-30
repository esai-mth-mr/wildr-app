import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class CommentsOrStoryButton extends StatelessWidget {
  final FeedGxC feedGxC;
  final String pageId;

  const CommentsOrStoryButton({
    required this.feedGxC,
    required this.pageId,
    super.key,
  });

  Widget _commentsButton(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(50),
        child: WildrIconButton(
          WildrIcons.chat_outline,
          color: const Color(0xD9FFFFFF),
          size: 22.0.w,
        ),
      );

  Widget _storyButton() => Stack(
        alignment: Alignment.center,
        children: [
          Center(
            child: CircularPercentIndicator(
              lineWidth: 3,
              percent:
                  1 - (feedGxC.currentPost.timeStamp?.expiryPercentage ?? 1),
              progressColor: Colors.orange[400]!,
              radius: 20.0.w,
              backgroundColor: Colors.grey[300]!,
            ),
          ),
          Center(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                color: Color(0x40000000),
                shape: BoxShape.circle,
              ),
              child: Icon(
                CupertinoIcons.timer,
                // color: Color(0x40000000),
                color: Colors.white,
                // color: Colors.black,
                size: 27.0.w,
              ),
            ),
          ),
        ],
      );

  @override
  Widget build(BuildContext context) {
    final child = feedGxC.currentPost.isStory()
        ? _storyButton()
        : _commentsButton(context);
    if (feedGxC.currentPost.isParentPostDeleted() &&
        !feedGxC.currentPost.isStory()) {
      return GestureDetector(
        onTap: () {
          Common().showSnackBar(
            context,
            AppLocalizations.of(context)!.feed_commentingDisabledMessage,
            millis: 2000,
          );
        },
        child: Opacity(
          opacity: 0.5,
          child: AbsorbPointer(
            child: child,
          ),
        ),
      );
    }
    return child;
  }
}
