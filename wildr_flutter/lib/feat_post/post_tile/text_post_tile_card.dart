import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class TextPostTileCard extends StatelessWidget {
  final Post post;
  final bool shouldRenderRichText;
  final int? maxLines;
  final double? maxFontSize;

  const TextPostTileCard({
    super.key,
    required this.post,
    this.shouldRenderRichText = true,
    this.maxLines,
    this.maxFontSize,
  });

  Widget _body() {
    if (shouldRenderRichText) {
      if (post.caption == null) return const Text('---');
      return SmartTextCommon().getAutoResizeText(
        segmentsOrCaption: post.caption,
        bodyText: post.bodyText,
        maxLines: maxLines,
        fontSize: maxFontSize,
      );
    }
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        post.bodyText ?? '',
        overflow: TextOverflow.ellipsis,
        maxLines: maxLines ?? 10,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: maxFontSize,
          color: Get.theme.textTheme.titleLarge!.color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Center(child: _body());
}
