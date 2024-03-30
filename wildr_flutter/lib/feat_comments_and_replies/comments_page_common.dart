// ignore_for_file: avoid_positional_boolean_parameters

part of 'comments_page.dart';

class CPCommon {
  static Widget mentionedList(
    MentionedObject? mentionedObject,
    List<SearchMentionResponse> mentionedResponseList,
    String? errorMessage,
    MentionsInputController richInputController, {
    required Function onInsertion,
    required Function onClose,
    bool shrinkWrap = false,
    required BuildContext context,
    required bool isChallenge,
    ScrollController? scrollController,
  }) {
    if (mentionedObject == null) {
      return const SizedBox.shrink();
    } else {
      return ChangeNotifierProvider(
        create: (BuildContext context) => ScreenHeight(),
        child: Consumer<ScreenHeight>(
          builder: (context, red, child) {
            final double maxMentionListBoxHeight =
                calculateMaxMentionListBoxHeight(context, red, isChallenge);
            final double itemHeight = mentionsItemHeight +
                13; //13 we have added because it is top/bottom padding for item

            double mentionListBoxHeight = mentionedResponseList.isEmpty
                ? 50.0
                : mentionedResponseList.length * itemHeight;
            mentionListBoxHeight =
                min(maxMentionListBoxHeight, mentionListBoxHeight);
            return Padding(
              padding: const EdgeInsets.only(
                left: 14,
                right: 14,
                bottom: 10,
                top: 10,
              ),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  height: mentionListBoxHeight,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Get.theme.colorScheme.background,
                    boxShadow: const [
                      BoxShadow(
                        color: WildrColors.primaryColor,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      if (mentionedResponseList.isEmpty)
                        Center(
                          child: errorMessage == null
                              ? const CupertinoActivityIndicator()
                              : Text(errorMessage),
                        )
                      else
                        SmartTextCommon().mentionsListV1(
                          mentionedResponseList,
                          richInputController,
                          mentionedObject,
                          onInsertion: onInsertion,
                          shrinkWrap: shrinkWrap,
                          scrollController: scrollController,
                        ),
                      Align(
                        alignment: Alignment.topRight,
                        child: IconButton(
                          alignment: Alignment.topRight,
                          padding: EdgeInsets.zero,
                          onPressed: () {
                            onClose();
                          },
                          icon: const WildrIcon(
                            WildrIcons.x_filled,
                            size: 20,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      );
    }
  }

  static double calculateMaxMentionListBoxHeight(
    BuildContext context,
    ScreenHeight res,
    bool isChallenge,
  ) {
    final double appBarHeight = isChallenge ? kToolbarHeight : 1;

    return MediaQuery.of(context).size.height -
        appBarHeight -
        res.keyboardHeight -
        MediaQuery.of(context).padding.bottom;
  }

  static MentionsInput mentionsInput({
    required FocusNode focusNode,
    required MentionsInputController controller,
    required Function onSubmit,
    required Function(String value) onChanged,
    required InputDecoration inputDecoration,
    ScrollController? scrollController,
  }) =>
      MentionsInput(
        focusNode: focusNode,
        controller: controller,
        maxLines: 3,
        minLines: 1,
        style: TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 18..sp,
          fontFamilyFallback: const [
            'Apple Color Emoji',
            'Noto Color Emoji',
          ],
          color: WildrColors.isLightMode() ? Colors.grey[800] : Colors.white,
        ),
        //expands: true,
        enableSuggestions: false,
        textCapitalization: TextCapitalization.sentences,
        textInputAction: TextInputAction.newline,
        keyboardAppearance: Get.theme.brightness,
        onSubmitted: (value) {
          // onSubmit();
        },
        onChanged: (text) {
          onChanged(text);
        },
        decoration: inputDecoration,
        scrollController: scrollController,
      );

  static Widget smartBody(
    String? body,
    List<Segment>? segments,
    BuildContext context,
  ) =>
      segments == null
          ? Text(
              body ?? 'WHY EMPTY STRING?',
              style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14.0.sp),
              textAlign: TextAlign.start,
            )
          : Text.rich(
              SmartTextCommon().createTextSpanFromSegments(
                segments,
                context: context,
                shouldNavigateToCurrentUser: false,
              ),
              style: TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 14.0.sp,
                color: WildrColors.textColor(context),
              ),
              textAlign: TextAlign.start,
            );

  static Color subtitleColor() =>
      Get.isDarkMode ? Colors.white70 : const Color(0xff54545D);

  static Widget leading(BuildContext context, Author author) =>
      Common().avatarFromAuthor(
        context,
        author,
        radius: 15.0.r,
        shouldNavigateToCurrentUser: false,
        ringDiff: 1,
        ringWidth: 1.2,
      );

  static TextButton handle(BuildContext context, Author author) => TextButton(
        style: TextButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: const Size(50, 20),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          alignment: Alignment.centerLeft,
        ),
        onPressed: () {
          Common().openProfilePage(
            context,
            author.id,
            shouldNavigateToCurrentUser: false,
            author: author,
          );
        },
        child: Text(
          '@${author.handle}',
          style: TextStyle(
            fontSize: 11.0.sp,
            color: Get.isDarkMode ? Colors.white70 : Colors.grey[600]!,
            fontWeight: FontWeight.w400,
          ),
        ),
      );

  static Widget likeButton({
    required bool isLiked,
    required int likeCount,
    required VoidCallback onLikeButtonPressed,
    required VoidCallback onLikeCountPressed,
  }) {
    final icon = isLiked
        ? const WildrIcon(
            WildrIcons.heart_filled,
            color: Colors.red,
          )
        : WildrIcon(
            WildrIcons.heart_outline,
            color: Get.isDarkMode ? Colors.white70 : Colors.grey[600]!,
          );

    return Column(
      children: [
        Expanded(
          child: IconButton(
            // visualDensity: VisualDensity.minimumDensity,
            padding: EdgeInsets.zero,
            onPressed: onLikeButtonPressed,
            icon: icon,
          ),
        ),
        GestureDetector(
          onTap: likeCount > 0 ? onLikeCountPressed : null,
          child: SizedBox(
            width: 40,
            child: Text(
              likeCount.toString(),
              style: TextStyle(
                fontSize: 12.0.sp,
                fontWeight: FontWeight.w600,
                color: Get.isDarkMode ? Colors.white70 : Colors.grey[600]!,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }
}
