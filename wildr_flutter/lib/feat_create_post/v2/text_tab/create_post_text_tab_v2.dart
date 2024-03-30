part of '../create_post_page_v2.dart';

class CreateTextTabV2 extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final bool isEditMode;
  final TextPostData? editTextPostData;

  final Challenge? defaultSelectedChallenge;
  const CreateTextTabV2({
    required this.createPostGxC,
    this.isEditMode = false,
    this.editTextPostData,
    this.defaultSelectedChallenge,
    super.key,
  });

  @override
  CreateTextTabV2State createState() => CreateTextTabV2State();
}

class CreateTextTabV2State extends State<CreateTextTabV2> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  Future<void> _onWhatsOnYourMindTap() async {
    if (widget.createPostGxC.posts.length == 5) {
      Common().showGetSnackBar(
        _appLocalizations.createPost_selectUpTo5PostsToShare,
        showIcon: true,
        snackPosition: SnackPosition.TOP,
      );
    } else {
      await context.pushRoute(
        CreateTextPostRoute(
          createPostGxC: widget.createPostGxC,
          defaultSelectedChallenge: widget.defaultSelectedChallenge,
          editTextPostData: widget.editTextPostData,
          isEditMode: widget.isEditMode,
        ),
      );
    }
  }

  Widget _positionedTextLimitLabel() => Positioned(
        bottom: 10,
        right: 10,
        child: Text(
          '/850',
          style: TextStyle(
            fontSize: 14.0.sp,
            color: WildrColors.gray500,
            fontWeight: FontWeight.w700,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  vertical: 10.0.h,
                  horizontal: 16.0.w,
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(16.0)),
                  child: Stack(
                    children: [
                      InkWell(
                        onTap: _onWhatsOnYourMindTap,
                        child: Container(
                          width: double.infinity,
                          height: Get.height,
                          color: WildrColors.blankPostAddColor(),
                          child: Center(
                            child: Text(
                              _appLocalizations.createPost_whatsOnYourMind,
                              style: TextStyle(
                                fontSize: 24.0.sp,
                                color: WildrColors.gray500,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                      _positionedTextLimitLabel(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}

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
