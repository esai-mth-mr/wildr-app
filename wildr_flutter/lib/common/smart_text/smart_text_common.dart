// ignore_for_file: lines_longer_than_80_chars, always_declare_return_types, cascade_invocations, avoid_positional_boolean_parameters

import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/utils.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';
import 'package:wildr_flutter/widgets/text/expandable_text.dart';

class Debouncer {
  final int milliseconds;
  VoidCallback? action;
  Timer? _timer;

  Debouncer({required this.milliseconds});

  void run(VoidCallback action) {
    if (_timer != null) {
      _timer!.cancel();
    }
    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }
}

void print(dynamic message) {
  debugPrint('SmartTextCommon: $message');
}

class SmartTextCommon {
  static final SmartTextCommon _instance = SmartTextCommon._internal();

  factory SmartTextCommon() => _instance;

  SmartTextCommon._internal();

  ///
  /// The regex pattern
  /// #id\+([\w\d\-_]*)\+di#|@id\+([\w\d\-_]*)\+di@|#([^\s^#^@]+)|([^\s^#^@]+)|(\n)|(\s)|(@)
  ///
  /// ORDER OF GROUPS MATTERS
  ///
  /// Group 1: (?:#id\+)([\w\d\-_]*)(?:\+di#)
  /// -> To detect Mentioned Tags
  /// Group 2: (?:@id\+)([\w\d\-_]*)(?:\+di@)
  /// -> To detect Mentioned Users
  /// Group 3: (?:#)([^\s^#^@]+)
  /// -> To detect Tags that were not selected from the MentionBox [MentionsInput]
  /// Group 4: ([^\s^#^@]+)
  /// -> To detect regular text except (i) Whitespaces (ii) `#` (iii) `@`
  /// --> `@` and `#` had to be excluded in Group 4 to not capture Mentioned Tags|Users as regular text
  /// Group 5: (\n)
  /// -> To detect new-line
  /// Group 6: (\s)
  /// -> To capture whitespaces
  /// Group 7: (@)
  /// -> To capture standalone '@';
  /// Group 8: (#)
  /// -> To capture standalone '#';
  ///
  Iterable<RegExpMatch> findMatchesFromMentionsInputControllerData(
    String data,
  ) {
    final regExp = RegExp(
      r'#id\+([\w\d\-_]*)\+di#|@id\+([\w\d\-_]*)\+di@|#([^\s^#^@]+)|([^\s#@]+)|(\n)|(\s)|(@)|(#)',
    );
    return regExp.allMatches(data);
  }

  /// * Sending `noSpace` for backward compatibility
  Map<String, dynamic> createContentForSubmission(
    String data, {
    String? body,
    bool shouldAddContentKey = true,
  }) {
    debugPrint(data);
    final List<Map<String, dynamic>> segments = [];
    final List<Map<String, dynamic>> textSegments = [];
    final List<Map<String, dynamic>> userSegments = [];
    final List<Map<String, dynamic>> tagSegments = [];
    int counter = 0;
    final matches = findMatchesFromMentionsInputControllerData(
      data.replaceAll(SPECIAL_CHAR_MENTIONS_INPUT, ''),
    );
    for (final match in matches) {
      final String? value = match.group(0);
      if (value == null) {
        continue;
      }
      String type;
      if (match.group(1) != null) {
        type = 'TAG';
        tagSegments.add({
          kPos: counter,
          'tag': {
            'id': match.group(1),
            'noSpace': false,
          },
        });
      } else if (match.group(2) != null) {
        type = 'USER';
        debugPrint('Group 2; user_segment; `${match.group(2)}`');
        userSegments.add({
          kPos: counter,
          kUserId: match.group(2),
        });
      } else if (match.group(3) != null) {
        type = 'TAG';
        debugPrint('Group 3; tag_segment_without_id; `${match.group(3)}`');
        tagSegments.add({
          kPos: counter,
          'tag': {
            'name': match.group(3),
            'noSpace': false,
          },
        });
      } else {
        type = 'TEXT';
        textSegments.add({
          kPos: counter,
          'text': {
            'chunk': value,
            'noSpace': false,
          },
        });
      }
      segments.add({kPos: counter, kType: type});
      counter++;
    }
    if (shouldAddContentKey) {
      return {
        'content': {
          'segments': segments,
          'textSegments': textSegments,
          'userSegments': userSegments,
          'tagSegments': tagSegments,
        },
      };
    } else {
      return {
        'segments': segments,
        'textSegments': textSegments,
        'userSegments': userSegments,
        'tagSegments': tagSegments,
      };
    }
  }

  List<Segment> createSegmentsFromTextEditorData(
    String data,
    List<RichBlock> blocks, {
    String? body,
  }) {
    final List<Segment> segments = [];
    final matches = findMatchesFromMentionsInputControllerData(data);
    for (final match in matches) {
      final String? value = match.group(0);
      if (value == null) continue;
      final Segment segment = Segment()..type = 2;
      if (match.group(1) != null) {
        debugPrint('Group 1; tag_segment_with_id');
        segment
          ..type = 3
          ..id = match.group(1)
          ..displayText = blocks
              .firstWhere((block) => block.data.contains(segment.id ?? ''))
              .text;
      } else if (match.group(2) != null) {
        debugPrint('Group 2; user_segment');
        segment
          ..type = 2
          ..id = match.group(2)
          ..displayText = blocks
              .firstWhere((block) => block.data.contains(segment.id ?? ''))
              .text;
      } else if (match.group(3) != null) {
        debugPrint('Group 3; tag_segment_without_id');
        segment
          ..type = 3
          ..displayText = match.group(3)!;
      } else {
        segment
          ..type = 1
          ..displayText = value;
      }
      segments.add(segment);
    }
    return segments;
  }

  //Used for caption
  DataFromSegments createDataFromSegments(
    List<Segment> segments, {
    BuildContext? context,
    int segmentsLimit = -1,
    TextStyle? style,
    bool shouldNavigateToCurrentUser = true,
    Color? clickableTextColor = WildrColors.primaryColor,
  }) {
    final List<InlineSpan> list = [];
    final List<int> counts = [];
    var charCount = 0;
    String text = '';
    bool isFirstOneJustAText = false;
    final List<Segment> trimmedSegments;
    if (segmentsLimit > 0) {
      trimmedSegments =
          segments.sublist(0, min(segmentsLimit, segments.length));
    } else {
      trimmedSegments = segments;
    }
    for (final element in trimmedSegments) {
      final int type = element.type;
      if (charCount == 0) {
        isFirstOneJustAText = type == 1;
      }
      final GestureRecognizer? recognizer = segmentTapGestureRecognizer(
        context: context,
        type: type,
        segment: element,
        shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUser,
      );
      String displayText = element.displayText;
      if (charCount == 0) {
        displayText = displayText.trimLeft();
      }
      final InlineSpan span = TextSpan(
        text: displayText,
        style: (type == 1)
            ? style
            : TextStyle(
                color: clickableTextColor,
                fontWeight: FontWeight.bold,
                fontSize: style?.fontSize ?? 14.0.sp,
              ),
        recognizer: recognizer,
      );
      list.add(span);
      charCount += displayText.length;
      counts.add(charCount);
      text += displayText;
      // text += " ";
    }
    return DataFromSegments(
      text: text,
      counts: counts,
      list: list,
      isFirstOneJustAText: isFirstOneJustAText,
    );
  }

  /// [context] is required to handle touch events on the text.
  TextSpan createTextSpanFromSegments(
    List<Segment> segments, {
    BuildContext? context,
    int segmentsLimit = -1,
    TextStyle? style,
    bool shouldNavigateToCurrentUser = true,
  }) {
    final List<InlineSpan> inlineSpans = [];
    bool shouldAddEllipse = false;
    final List<Segment> trimmedSegments;
    if (segmentsLimit > 0) {
      shouldAddEllipse = segmentsLimit < segments.length;
      trimmedSegments =
          segments.sublist(0, min(segmentsLimit, segments.length));
    } else {
      trimmedSegments = segments;
    }
    final Tuple<TextSpan, String> tuple = createTextAndSpanFromSegments(
      trimmedSegments,
      context: context,
      segmentsLimit: segmentsLimit,
      style: style,
      shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUser,
    );
    inlineSpans.addAll([...tuple.item1.children ?? []]);
    if (shouldAddEllipse) {
      inlineSpans.add(TextSpan(text: '...', style: style));
    }
    return TextSpan(children: inlineSpans);
  }

  /// [context] is required to handle touch events on the text.
  Tuple<TextSpan, String> createTextAndSpanFromSegments(
    List<Segment> segments, {
    BuildContext? context,
    int segmentsLimit = -1,
    TextStyle? style,
    bool shouldNavigateToCurrentUserTab = true,
  }) {
    final List<InlineSpan> inlineSpans = [];
    String completeBodyStr = '';
    List<Segment> trimmedSegments;
    if (segmentsLimit > 0) {
      trimmedSegments =
          segments.sublist(0, min(segmentsLimit, segments.length));
    } else {
      trimmedSegments = segments;
    }
    trimmedSegments.asMap().forEach((index, element) {
      final int type = element.type;
      String displayText = element.displayText;
      final GestureRecognizer? recognizer = segmentTapGestureRecognizer(
        context: context,
        type: type,
        segment: element,
        shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUserTab,
      );
      if (index == 0) {
        displayText = element.displayText.trimLeft();
      }
      completeBodyStr += displayText;
      final InlineSpan span = TextSpan(
        text: displayText,
        style: (type == 1)
            ? style
            : const TextStyle(
                color: WildrColors.primaryColor,
                fontWeight: FontWeight.w600,
              ),
        recognizer: recognizer,
      );
      inlineSpans.add(span);
    });
    return Tuple(
      item1: TextSpan(children: inlineSpans),
      item2: completeBodyStr,
    );
  }

  Widget getAutoResizeTextForFeed(
    Post post,
    BuildContext context,
  ) =>
      getAutoResizeText(
        segmentsOrCaption: post.caption,
        bodyText: post.bodyText,
        context: context,
      );

  Widget getAutoResizeTextForFeedFromSubPost(
    SubPost subPost,
    BuildContext context, {
    bool shouldNavigateToCurrentUserTab = true,
  }) =>
      getAutoResizeText(
        segmentsOrCaption: subPost.caption,
        bodyText: subPost.bodyText,
        context: context,
        shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUserTab,
      );

  Widget getAutoResizeText({
    List<Segment>? segmentsOrCaption,
    String? bodyText,
    BuildContext? context,
    bool shouldNavigateToCurrentUserTab = true,
    int? maxLines = 40,
    double? fontSize = 38,
  }) {
    if (segmentsOrCaption == null) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 6.0,
        ),
        child: AutoSizeText(
          bodyText ?? '--',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: fontSize,
            color: Get.theme.textTheme.titleLarge!.color,
          ),
          maxLines: maxLines,
          softWrap: true,
          wrapWords: false,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
        ),
      );
    }
    final Tuple<TextSpan, String> tuple = createTextAndSpanFromSegments(
      segmentsOrCaption,
      context: context,
      shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUserTab,
    );
    final length = segmentsOrCaption.length;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 10.0,
      ), // Add the desired horizontal padding
      child: AutoSizeText.rich(
        tuple.item1,
        softWrap: true,
        wrapWords: false,
        style: TextStyle(
          fontWeight: length > 80
              ? FontWeight.w500
              : length > 40
                  ? FontWeight.w600
                  : FontWeight.w700,
          fontSize: fontSize,
          letterSpacing: length > 80
              ? 1
              : length > 60
                  ? 1.5
                  : 2,
          color: Get.theme.textTheme.titleLarge!.color,
        ),
        maxLines: maxLines,
        overflow: TextOverflow.ellipsis,
        textAlign: length > 80 ? TextAlign.start : TextAlign.center,
      ),
    );
  }

  Widget getAutoResizeTextPreview({
    List<Segment>? segmentsOrCaption,
    String? bodyText,
    BuildContext? context,
    double? min,
    double? max,
    bool shouldNavigateToCurrentUserTab = true,
  }) {
    if (segmentsOrCaption == null) {
      return AutoSizeText(
        bodyText ?? '--',
        style: TextStyle(
          fontWeight: FontWeight.normal,
          color: Get.theme.textTheme.titleLarge!.color,
        ),
        maxLines: 35,
        softWrap: true,
        wrapWords: false,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
      );
    }
    final Tuple<TextSpan, String> tuple = createTextAndSpanFromSegments(
      segmentsOrCaption,
      context: context,
      shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUserTab,
    );
    return AutoSizeText.rich(
      tuple.item1,
      softWrap: true,
      wrapWords: false,
      style: TextStyle(
        fontWeight: FontWeight.normal,
        letterSpacing: .2,
        color: Get.theme.textTheme.titleLarge!.color,
      ),
      maxLines: 40,
      overflow: TextOverflow.ellipsis,
      textAlign: TextAlign.center,
      minFontSize: min ?? 1,
      maxFontSize: max ?? 3,
    );
  }

  HandleMentionedObjectResult handleMentionedObject({
    required MentionsInputController controller,
    required MentionedObject? mentionedObject,
    required MainBloc mainBloc,
    required List<SearchMentionResponse> mentionedResponseList,
  }) {
    final calculatedMentionedObject = performTagsAndMentionedDetectionAndSearch(
      controller,
      mentionedObject,
      mainBloc,
    );
    if (calculatedMentionedObject == null && mentionedObject == null) {
      return HandleMentionedObjectResult.noUpdate();
    }
    mentionedObject = calculatedMentionedObject;
    if (mentionedObject == null) {
      mentionedResponseList = [];
    }
    return HandleMentionedObjectResult(mentionedObject, mentionedResponseList);
  }

  MentionedObject? performTagsAndMentionedDetectionAndSearch(
    MentionsInputController controller,
    MentionedObject? mentionedObject,
    MainBloc mainBloc,
  ) {
    MentionedObject? updatedMentionedObject = mentionedObject;
    final cursorPos = controller.selection.baseOffset;
    final String text = controller.text;
    final RegExp regExp =
        RegExp(r'(^| |\n)([@#])[\w\d_]*', caseSensitive: false);
    final matches = regExp.allMatches(text);
    if (matches.isEmpty) return null;
    for (final RegExpMatch element in matches) {
      final int start = element.start;
      final int end = element.end;
      if (cursorPos >= start && cursorPos <= end) {
        final query = text.substring(start, end).trim();
        final ESSearchType type =
            (query.startsWith('#')) ? ESSearchType.HASHTAGS : ESSearchType.USER;
        updatedMentionedObject =
            MentionedObject(start: start, end: end, str: query, type: type);
        if (query.length == 1) {
          mainBloc.add(MentionsInputEvent('', type));
        } else {
          mainBloc
              .add(MentionsInputEvent(query.substring(1, query.length), type));
        }
        break;
      } else {
        updatedMentionedObject = null;
      }
    }
    return updatedMentionedObject;
  }

  Widget mentionsList(
    List<SearchMentionResponse> responseList,
    MentionsInputController controller,
    MentionedObject mentionedUser, {
    required Function onInsertion,
    required bool shouldShowRing,
    bool shrinkWrap = false,
    Color? handleColor,
    bool shouldNavigateToProfile = false,
  }) =>
      ListView.builder(
        padding: const EdgeInsets.only(top: 8),
        shrinkWrap: shrinkWrap,
        scrollDirection: Axis.horizontal,
        itemCount: responseList.length,
        itemBuilder: (context, index) {
          final item = responseList[index];
          return Padding(
            padding: EdgeInsets.symmetric(horizontal: 1.0.w),
            child: InkWell(
              onTap: () {
                String text = controller.text;
                text = text.replaceRange(
                  mentionedUser.start,
                  mentionedUser.end,
                  ' ',
                );
                controller.text = text;
                if (text.trim().isEmpty) controller.clear();
                controller
                  ..insertBlock(
                    RichBlock(
                      text: '${mentionedUser.initialStr}${item.displayText()}',
                      data:
                          '${mentionedUser.initialStr}id+${item.id()}+di${mentionedUser.initialStr}',
                      style: const TextStyle(
                        color: WildrColors.primaryColor,
                        backgroundColor: Colors.transparent,
                      ),
                    ),
                  )
                  ..insertText('');
                onInsertion();
              },
              child: SizedBox(
                width: 60.0.w,
                child: Column(
                  children: [
                    IgnorePointer(
                      child: item.avatar(
                        context,
                        20.0.r,
                        shouldShowRing,
                        shouldNavigateToProfile: shouldNavigateToProfile,
                      ),
                    ),
                    SizedBox(height: 2.0.h),
                    Text(
                      item.firstLabel(),
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: handleColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 13.0.sp,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );

  Widget mentionsListV1(
    List<SearchMentionResponse> responseList,
    MentionsInputController controller,
    MentionedObject mentionedUser, {
    required Function onInsertion,
    bool shrinkWrap = false,
    bool shouldNavigateToProfile = false,
    ScrollController? scrollController,
  }) =>
      Scrollbar(
        thumbVisibility: true,
        controller: scrollController,
        child: ListView.builder(
          controller: scrollController,
          padding: const EdgeInsets.only(top: 8, bottom: 5),
          shrinkWrap: shrinkWrap,
          itemCount: responseList.length,
          itemBuilder: (context, index) {
            final item = responseList[index];
            return SizedBox(
              height: mentionsItemHeight,
              child: ListTile(
                leading: item.avatar(
                  context,
                  15.0.r,
                  true,
                  shouldNavigateToProfile: shouldNavigateToProfile,
                ),
                title: Text(
                  item.firstLabel(),
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13.0.sp,
                  ),
                  textAlign: TextAlign.start,
                ),
                subtitle: item.secondLabel() == null
                    ? null
                    : Text(
                        item.secondLabel()!,
                        style: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontSize: 11.0.sp,
                        ),
                        textAlign: TextAlign.start,
                      ),
                onTap: () {
                  String text = controller.text;
                  text = text.replaceRange(
                    mentionedUser.start,
                    mentionedUser.end,
                    ' ',
                  );
                  controller.text = text;
                  if (text.trim().isEmpty) {
                    controller.clear();
                  }
                  controller
                    ..insertBlock(
                      RichBlock(
                        text:
                            '${mentionedUser.initialStr}${item.displayText()}',
                        data:
                            '${mentionedUser.initialStr}id+${item.id()}+di${mentionedUser.initialStr}',
                        style: const TextStyle(
                          color: WildrColors.primaryColor,
                          backgroundColor: Colors.transparent,
                        ),
                      ),
                    )
                    ..insertText('');
                  onInsertion();
                },
              ),
            );
          },
        ),
      );

  Widget hashtagList(
    List<SearchMentionResponse> responseList,
    MentionsInputController controller,
    MentionedObject mentionedUser, {
    required Function onInsertion,
    bool shrinkWrap = false,
  }) =>
      ColoredBox(
        color: WildrColors.singleChallengeBGColor(),
        child: ListView.builder(
          padding: const EdgeInsets.only(top: 2),
          shrinkWrap: shrinkWrap,
          itemCount: responseList.length,
          itemBuilder: (context, index) {
            final item = responseList[index];
            return ListTile(
              visualDensity: const VisualDensity(vertical: -4),
              leading: Text(
                '#${item.firstLabel()}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13.0,
                ),
              ),
              onTap: () {
                String text = controller.text;
                text = text.replaceRange(
                  mentionedUser.start,
                  mentionedUser.end,
                  ' ',
                );
                controller.text = text;
                if (text.trim().isEmpty) {
                  controller.clear();
                }
                controller
                  ..insertBlock(
                    RichBlock(
                      text: '${mentionedUser.initialStr}${item.displayText()}',
                      data:
                          '${mentionedUser.initialStr}id+${item.id()}+di${mentionedUser.initialStr}',
                      style: const TextStyle(
                        color: WildrColors.primaryColor,
                        backgroundColor: Colors.transparent,
                      ),
                    ),
                  )
                  ..insertText('');
                onInsertion();
              },
            );
          },
        ),
      );

  //Common().
  void onTagTap(Segment element, BuildContext context) {
    context.pushRoute(SearchSingleTagPageRoute(tagName: element.displayText));
  }

  void onMentionTap(
    Segment element,
    BuildContext context, {
    required bool shouldNavigateToCurrentUserTab,
  }) {
    Common().openProfilePage(
      context,
      element.id!,
      shouldNavigateToCurrentUser: shouldNavigateToCurrentUserTab,
    );
  }

  GestureRecognizer? segmentTapGestureRecognizer({
    required BuildContext? context,
    required Segment segment,
    required bool shouldNavigateToCurrentUserTab,
    required int type,
  }) {
    GestureRecognizer? recognizer;
    if (context != null) {
      if (type == 2) {
        recognizer = TapGestureRecognizer()
          ..onTap = () {
            onMentionTap(
              segment,
              shouldNavigateToCurrentUserTab: shouldNavigateToCurrentUserTab,
              context,
            );
          };
      } else if (type == 3) {
        recognizer = TapGestureRecognizer()
          ..onTap = () {
            onTagTap(segment, context);
          };
      }
    }
    return recognizer;
  }
}

class HandleMentionedObjectResult {
  final MentionedObject? mentionedObject;
  final List<SearchMentionResponse> mentionedResponseList;
  final bool shouldUpdate;

  HandleMentionedObjectResult(this.mentionedObject, this.mentionedResponseList)
      : shouldUpdate = true;

  HandleMentionedObjectResult.noUpdate()
      : shouldUpdate = false,
        mentionedObject = null,
        mentionedResponseList = [];
}
