import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PreviewTextPost extends StatelessWidget {
  final List<Segment> segments;
  final double height;
  final bool shouldAddDecoration;
  final bool addBottomPadding;

  const PreviewTextPost(
    this.segments,
    this.height, {
    this.shouldAddDecoration = true,
    this.addBottomPadding = true,
    super.key,
  });

  @override
  Widget build(BuildContext context) => Container(
      margin: EdgeInsets.only(
        left: 10,
        right: 10,
        top: MediaQuery.of(context).padding.top + 20,
        bottom: addBottomPadding ? 28.0.wh * 3 - 20 : 0,
      ),
      decoration: shouldAddDecoration
          ? BoxDecoration(
              color: WildrColors.textPostBGColor(context),
              borderRadius: BorderRadius.circular(20),
            )
          : null,
      child: Center(
        child: SmartTextCommon().getAutoResizeText(
          segmentsOrCaption: segments,
          context: context,
        ),
      ),
    );
}
