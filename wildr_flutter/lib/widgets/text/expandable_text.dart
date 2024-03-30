import 'dart:math';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';

class DataFromSegments {
  bool isFirstOneJustAText;
  String text;
  List<int> counts;
  List<InlineSpan> list;

  DataFromSegments({
    required this.text,
    required this.counts,
    required this.list,
    this.isFirstOneJustAText = false,
  });
}

class ExpandableTextFromSegments extends StatefulWidget {
  final List<Segment> segments;
  final int trimLines;
  // ignore: avoid_positional_boolean_parameters
  final Function(bool isShrinked)? onStateToggled;
  final TextStyle? clickableTextStyle;
  final TextStyle? contentStyle;
  final String? readMoreButtonText;
  final String? readLessButtonText;
  final bool contracted;
  final bool shouldOptimize;
  final int optimizeLength;
  final Color? tagsOrMentionsColor;

  const ExpandableTextFromSegments(
    this.segments, {
    this.trimLines = 2,
    this.onStateToggled,
    this.clickableTextStyle,
    this.contentStyle,
    this.readMoreButtonText = '...read more',
    this.readLessButtonText = '\nSee less',
    this.contracted = true,
    this.shouldOptimize = false,
    this.optimizeLength = 4,
    this.tagsOrMentionsColor,
    super.key,
  });

  @override
  ExpandableTextFromSegmentsState createState() =>
      ExpandableTextFromSegmentsState();
}

class ExpandableTextFromSegmentsState
    extends State<ExpandableTextFromSegments> {
  late bool isContracted = widget.contracted;

  TextSpan get readMoreOrLessSpan => TextSpan(
        text: widget.contracted
            ? widget.readMoreButtonText
            : widget.readLessButtonText,
        style: widget.clickableTextStyle ?? Common().captionTextStyle(),
        recognizer: TapGestureRecognizer()..onTap = _onTapLink,
      );

  @override
  Widget build(BuildContext context) {
    final bool isContracted = widget.contracted;
    final DataFromSegments data = SmartTextCommon().createDataFromSegments(
      widget.segments,
      style: widget.contentStyle,
      clickableTextColor: widget.tagsOrMentionsColor,
      context: context,
    );
    final Widget result = LayoutBuilder(
      builder: (context, constraints) {
        if (data.list.isEmpty) {
          return const Text('');
        }
        if (widget.shouldOptimize) {
          if (widget.contracted) {
            List<InlineSpan> list;
            if (data.list.length > widget.optimizeLength) {
              list = data.list.sublist(0, widget.optimizeLength)
                ..add(readMoreOrLessSpan);
            } else {
              list = data.list;
            }
            final TextSpan span = TextSpan(
              children: list,
            );
            return Text.rich(
              span,
            );
          } else {
            if (data.list.length > widget.optimizeLength) {
              final TextSpan span = TextSpan(
                children: data.list..add(readMoreOrLessSpan),
              );
              return Text.rich(
                span,
              );
            } else {
              final TextSpan span = TextSpan(
                children: data.list,
              );
              return Text.rich(
                span,
              );
            }
          }
        }
        final double maxWidth = constraints.maxWidth;
        final TextPainter painter = TextPainter(
          text: readMoreOrLessSpan,
          textDirection: TextDirection.rtl,
          maxLines: 2,
          ellipsis: '...',
        )..layout(
            minWidth: constraints.minWidth,
            maxWidth: maxWidth,
          );
        final readMoreOrLessSize = painter.size;
        painter
          ..text = TextSpan(
            text: data.text,
          )
          ..layout(
            minWidth: constraints.minWidth,
            maxWidth: maxWidth,
          );
        final textSize = painter.size;
        int endIndex;
        final pos = painter.getPositionForOffset(
          Offset(
            textSize.width - readMoreOrLessSize.width,
            textSize.height,
          ),
        );
        endIndex = painter.getOffsetBefore(pos.offset) ?? 0;
        TextSpan updatedSpan;
        if (painter.didExceedMaxLines) {
          if (isContracted) {
            int limit = -1;
            for (int i = 0; i < data.counts.length; i++) {
              if (endIndex <= data.counts[i]) {
                if (endIndex == data.counts[i]) {
                  limit = i;
                } else {
                  limit = i - 1;
                }
                break;
              }
            }
            if (limit >= 0) {
              final listOfSpans = data.list.sublist(0, max(limit, 1));
              updatedSpan = TextSpan(
                children: listOfSpans..add(readMoreOrLessSpan),
              );
            } else {
              if (data.isFirstOneJustAText) {
                final text = data.text.substring(0, endIndex);
                updatedSpan = TextSpan(
                  text: text,
                  style: widget.contentStyle,
                  children: [readMoreOrLessSpan],
                );
              } else {
                //Just add showMoreButton
                updatedSpan = TextSpan(children: [readMoreOrLessSpan]);
              }
            }
          } else {
            updatedSpan = TextSpan(
              style: widget.contentStyle,
              children: data.list..add(readMoreOrLessSpan),
            );
          }
        } else {
          updatedSpan = TextSpan(
            children: data.list,
          );
        }
        return Text.rich(
          updatedSpan,
        );
      },
    );
    return result;
  }

  void _onTapLink() {
    debugPrint('OnTapped');
    setState(() {
      isContracted = !widget.contracted;
    });
    if (widget.onStateToggled != null) {
      widget.onStateToggled?.call(isContracted);
    }
  }
}
