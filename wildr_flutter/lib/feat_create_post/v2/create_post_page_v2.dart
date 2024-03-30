// ignore_for_file: lines_longer_than_80_chars

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:animated_widgets/widgets/opacity_animated.dart';
import 'package:auto_route/auto_route.dart';
import 'package:camera/camera.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_compress/video_compress.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/post_draft_setting.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/draft_tab.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_manager_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/gxc/select_album_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/upload_tab.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/draft_actions_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/upload/upload_permission_bottom_sheet.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/camera_permission_page.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

part 'media_tab/create_post_media_tab_v2.dart';

part 'text_tab/create_post_text_tab_v2.dart';

void print(dynamic message) {
  debugPrint('CreatePostPage: $message');
}

class Loader extends AnimatedWidget {
  const Loader(Animation<double> animation, {super.key})
      : super(listenable: animation);

  Animation<double> get percentage => listenable as Animation<double>;

  @override
  Widget build(BuildContext context) => CircularPercentIndicator(
        backgroundColor: Colors.transparent,
        progressColor: Colors.red[600]!,
        percent: percentage.value,
        lineWidth: 3,
        circularStrokeCap: CircularStrokeCap.round,
        radius: (Get.width * 0.14) / 2,
      );
}

class AddPost extends StatelessWidget {
  final VoidCallback onTap;
  final double width;
  final double height;
  final bool isUpload;

  const AddPost({
    super.key,
    required this.onTap,
    this.isUpload = false,
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: width,
          height: height,
          margin:
              EdgeInsets.symmetric(horizontal: 8, vertical: isUpload ? 0 : 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            color: WildrColors.addPostColor(),
          ),
          child: Icon(
            Icons.add,
            size: 14,
            color: WildrColors.addBtnColor(),
          ),
        ),
      );
}

class CustomPageViewScrollPhysics extends ScrollPhysics {
  const CustomPageViewScrollPhysics({super.parent});

  @override
  CustomPageViewScrollPhysics applyTo(ScrollPhysics? ancestor) =>
      CustomPageViewScrollPhysics(parent: buildParent(ancestor)!);

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 50,
        stiffness: 100,
        damping: 0.8,
      );
}

class CreatePostPageV2 extends StatefulWidget {
  final MainBloc mainBloc;
  final Challenge? defaultSelectedChallenge;

  const CreatePostPageV2({
    super.key,
    required this.mainBloc,
    this.defaultSelectedChallenge,
  });

  @override
  State<CreatePostPageV2> createState() => _CreatePostPageV2State();
}

class _CreatePostPageV2State extends State<CreatePostPageV2>
    with TickerProviderStateMixin {
  late final PageController _pageController;
  late final CreatePostGxC _createPostGxC;
  final PageController _pageControllerForBottomTab =
      PageController(viewportFraction: 0.22, initialPage: 1);

  bool showAppAndTabBar = true;
  bool isRecording = false;
  String recordingTime = '0:0';
  final List<String> itemList = ['Upload', 'Camera', 'Write', 'Draft'];
  int selectedIndex = 1;
  final _cameraTabIndex = 1;
  final SelectAlbumGxC _selectAlbumGxC = Get.put(SelectAlbumGxC());
  late PostSettingsGxC _postSettingsGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final DraftGxC draftGxC = Get.put(DraftGxC());

  final DraftManagerGxC draftController = Get.put(DraftManagerGxC());

  @override
  void initState() {
    Get.put(PostSettingsGxC());
    _createPostGxC = Get.put(CreatePostGxC());
    _postSettingsGxC = Get.put(
      PostSettingsGxC(),
      tag: 'uploadMultiPost',
    );
    super.initState();
    _pageController = PageController(initialPage: 1);

    _createPostGxC.height = widget.mainBloc.height;
  }

  void _onTabChanged(int index, {isFromPageView = false}) {
    FirebaseAnalytics.instance.setCurrentScreen(
      screenName:
          "${CreatePostPageV2Route.name}/${index == _cameraTabIndex ? "Media" : "Text"}",
    );

    setState(() {
      if (isFromPageView) {
        selectedIndex = index;
        _pageControllerForBottomTab.jumpToPage(index);
      } else {
        _pageController.jumpToPage(index);
      }
    });
  }

  Future<void> _draftChallengePost() async {
    final List<Map<String, dynamic>> jsonDataList = _createPostGxC.posts
        .map(
          (postData) => {
            'type': postData.runtimeType.toString(),
            'data': postData.toJson(),
          },
        )
        .toList();

    PostSettingsDraft(
      postVisibilityAccess: _postSettingsGxC.selectedPostVisibilityAccess.name,
      commentVisibilityAccess:
          _postSettingsGxC.selectedCommentVisibilityAccess.name,
      commentPostingAccess: _postSettingsGxC.selectedCommentPostingAccess.name,
      postsData: jsonEncode(jsonDataList),
      challengeId: widget.defaultSelectedChallenge?.id ?? '',
      draftType: widget.defaultSelectedChallenge?.id != null
          ? PostDraftType.CHALLENGE
          : PostDraftType.DEFAULT,
    ).saveToSharedPreference();
    _createPostGxC
      ..clearAll()
      ..update();
    selectedIndex = 3;
    _pageController.jumpToPage(3);
    _onTabChanged(3, isFromPageView: true);
  }

  void recordTime() {
    final startTime = DateTime.now();
    // ignore: use_named_constants
    Timer.periodic(const Duration(), (t) {
      final diff = DateTime.now().difference(startTime);
      recordingTime =
          '${diff.inHours == 0 ? '' : '${diff.inHours.toString().padLeft(2, "0")}:'}${(diff.inMinutes % 60).floor().toString().padLeft(2, "0")}:${(diff.inSeconds % 60).floor().toString().padLeft(2, '0')}';
      if (!isRecording) {
        t.cancel();
      }
      setState(() {});
    });
  }

  void _handleMainState(BuildContext context, MainState state) {
    if (state is CloseCreatePostPageState) {
      Navigator.pop(context);
    } else if (state is GoToCameraState) {
      selectedIndex = 1;
      _pageController.jumpToPage(1);
      _onTabChanged(1, isFromPageView: true);
    } else if (state is StartRecordingState) {
      setState(() {
        showAppAndTabBar = false;
        isRecording = true;
      });
      recordTime();
    } else if (state is StopRecordingState) {
      setState(() {
        showAppAndTabBar = true;
        isRecording = false;
      });
    } else if (state is DraftUpdatedState) {
      setState(() {});
    }
  }

  int _getPostPreviewItemCount(CreatePostGxC controller) =>
      controller.posts.isEmpty
          ? 0
          : controller.posts.length + (controller.posts.length < 5 ? 1 : 0);

  void _navigateToUploadMultiMediaPost() {
    context
        .pushRoute(
      UploadMultiMediaPostV2Route(
        createPostGxC: _createPostGxC,
        defaultSelectedChallenge: widget.defaultSelectedChallenge,
      ),
    )
        .then((value) {
      if (value != null) {
        if ((value as Map<String, dynamic>)['type'] == 'draft') {
          _onTabChanged(3);
        } else if (value['type'] == 'camera') {
          _onTabChanged(1);
        }
      }
    });
  }

  Widget _textPostContentPreview(List<Segment> segments) => Container(
        width: 32.0.w,
        height: 45.0.h,
        decoration: BoxDecoration(
          color: WildrColors.textPostBGColor(context),
          borderRadius: BorderRadius.circular(4),
        ),
        child: AbsorbPointer(
          child: Center(
            child: SmartTextCommon().getAutoResizeTextPreview(
              segmentsOrCaption: segments,
              context: context,
            ),
          ),
        ),
      );

  Widget _imagePreview(File imageFile) => Container(
        width: 32,
        height: 45,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Common().clipIt(
          radius: 4,
          child: Image.file(
            imageFile,
            fit: BoxFit.contain,
          ),
        ),
      );

  Widget _storageMediaPreview(photo_manager.AssetEntity assetEntity) =>
      SizedBox(
        width: 32,
        height: 45,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Common().clipIt(
                  radius: 4,
                  child: photo_manager.AssetEntityImage(
                    assetEntity,
                    isOriginal: false,
                    width: 32,
                    height: 45,
                    thumbnailSize:
                        const photo_manager.ThumbnailSize.square(250),
                    fit: assetEntity.width > assetEntity.height
                        ? (assetEntity.type == photo_manager.AssetType.video)
                            ? BoxFit.cover
                            : BoxFit.contain
                        : BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        CreatePostCommon().unableToLoadImageText(),
                  ),
                ),
              ),
            ),
            if (assetEntity.type == photo_manager.AssetType.video)
              _videoThumbnailIcon(),
          ],
        ),
      );

  List<Widget> _draftActions() => [
        Obx(
          () {
            final drafts = draftController.drafts;
            if (drafts.isEmpty) {
              return const SizedBox();
            }
            return Center(
              child: _editDraftButton(),
            );
          },
        ),
      ];

  Widget _editDraftButton() => Padding(
        padding: EdgeInsets.only(right: 10.0.w),
        child: InkWell(
          onTap: () {
            if (draftGxC.isEditing) {
              draftGxC.clearAll();
            } else {
              draftGxC.isEditing = !draftGxC.isEditing;
            }

            draftGxC.update();
          },
          child: Text(
            _appLocalizations.createPost_edit,
            style: const TextStyle(
              color: WildrColors.gray500,
            ),
          ),
        ),
      );

  List<Widget> _createPostActions() => [
        Center(
          child: Padding(
            padding: EdgeInsets.only(right: 4.0.w),
            child: InkWell(
              onTap: () {
                if (_createPostGxC.posts.isNotEmpty) {
                  _navigateToUploadMultiMediaPost();
                }
              },
              child: GetBuilder<CreatePostGxC>(
                init: _createPostGxC,
                builder: (controller) => Text(
                  _appLocalizations.comm_cap_next,
                  style: TextStyle(
                    color: controller.posts.isEmpty
                        ? WildrColors.nextDisableColor()
                        : WildrColors.primaryColor,
                  ),
                ),
              ),
            ),
          ),
        ),
      ];

  Widget _videoThumbnailIcon() => Align(
        child: WildrIcon(
          WildrIcons.videoThumbnailIcon,
          color: WildrColors.gray100,
          size: (Get.width / 3) / 10,
        ),
      );

  Widget _videoPostPreview(VideoPostData postData) => Common().clipIt(
        radius: 4,
        child: SizedBox(
          width: 32,
          height: 45,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.file(
                File(postData.thumbFile?.path ?? ''),
                fit: BoxFit.fill,
              ),
              _videoThumbnailIcon(),
            ],
          ),
        ),
      );

  Widget _postPreviewGesture(
    BuildContext context,
    CreatePostGxC controller,
    int index,
  ) =>
      GestureDetector(
        onTap: () {
          CreatePostCommon().openPostsBottomSheet(
            context: context,
            createPostGxC: _createPostGxC,
          );
        },
        child: Center(
          child: Padding(
            padding: EdgeInsets.only(
              left: index == 0 ? 8.0 : 0.0,
              right: 8.0,
              top: 8.0,
              bottom: 8.0,
            ),
            child: _postPreview(controller.posts[index]),
          ),
        ),
      );

  Widget _addPost() => AddPost(
        onTap: () {},
        width: 32,
        height: 45,
      );

  Widget _postPreviews(CreatePostGxC controller) => ListView.builder(
        scrollDirection: Axis.horizontal,
        shrinkWrap: true,
        itemCount: _getPostPreviewItemCount(controller),
        itemBuilder: (context, index) {
          if (index < controller.posts.length) {
            return _postPreviewGesture(context, controller, index);
          } else if (controller.posts.length < 5) {
            return _addPost();
          } else {
            return _addPost();
          }
        },
      );

  Widget? _postPreview(PostData postData) {
    if (postData is TextPostData) {
      return _textPostContentPreview(postData.segments ?? []);
    } else if (postData is ImagePostData) {
      return _imagePreview(postData.croppedFile!);
    } else if (postData is StorageMediaPostData) {
      return _storageMediaPreview(postData.assetEntity!);
    } else if (postData is VideoPostData) {
      return _videoPostPreview(postData);
    }
    return null;
  }

  Future _onBackPressed() async {
    if (selectedIndex == 3) {
      if (draftGxC.isEditing) {
        draftGxC..clearAll()
        ..update();
      }
    }
    if (_createPostGxC.postCount < 1) {
      Navigator.of(context).pop();
      return;
    }
    return await showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => DraftActionsBottomSheet(
        deleteTap: () {
          Navigator.pop(context);
        },
        saveDraftTap: () {
          _draftChallengePost();
        },
      ),
    );
  }

  List<Widget> _appbarActions() {
    if (selectedIndex == 3) {
      return _draftActions();
    } else {
      return _createPostActions();
    }
  }

  Widget _appbarTitle() {
    if (selectedIndex == 3) {
      return Text(_appLocalizations.createPost_cap_draft);
    } else {
      return SizedBox(
        height: 60,
        child: GetBuilder<CreatePostGxC>(
          init: _createPostGxC,
          builder: (controller) => _postPreviews(controller),
        ),
      );
    }
  }

  AppBar _appBar() => AppBar(
        titleSpacing: Get.width * 0.1,
        centerTitle: true,
        leading: IconButton(
          icon: WildrIcon(
            WildrIcons.x_outline,
            color: WildrColors.appBarTextColor(),
          ),
          onPressed: _onBackPressed,
        ),
        title: _appbarTitle(),
        actions: _appbarActions(),
      );

  Widget _bottomTabBarWidget() => Padding(
        padding: EdgeInsets.only(bottom: Platform.isIOS ? 8.0 : 0),
        child: SizedBox(
          height: 50,
          child: PageView.builder(
            controller: _pageControllerForBottomTab,
            onPageChanged: (index) {
              _onTabChanged(index);
            },
            physics: const CustomPageViewScrollPhysics(),
            itemCount: itemList.length,
            itemBuilder: (context, index) {
              final isSelected = index == selectedIndex;
              final TextStyle selectedTextStyle = TextStyle(
                color: WildrColors.appBarTextColor(context),
                fontWeight: FontWeight.w700,
              );
              return GestureDetector(
                onTap: () {
                  _pageControllerForBottomTab.animateToPage(
                    index,
                    duration: const Duration(milliseconds: 100),
                    curve: Curves.ease,
                  );
                  _onTabChanged(index);
                },
                child: Text(
                  itemList[index],
                  textAlign: TextAlign.center,
                  style: isSelected
                      ? selectedTextStyle
                      : const TextStyle(color: WildrColors.gray600),
                ),
              );
            },
          ),
        ),
      );

  Widget _recordingTimeText() => Padding(
        padding: const EdgeInsets.only(bottom: 18.0),
        child: Text(
          recordingTime,
          textAlign: TextAlign.center,
        ),
      );

  Widget _bottomNavBar() {
    if (!showAppAndTabBar) {
      return _recordingTimeText();
    } else {
      return GetBuilder<DraftGxC>(
        init: draftGxC,
        builder: (controller) {
          if (controller.isEditing && controller.selectedIndices.isNotEmpty) {
            return const SizedBox();
          }
          return _bottomTabBarWidget();
        },
      );
    }
  }

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: _handleMainState,
        child: Obx(
          () => OpacityAnimatedWidget.tween(
            enabled: _createPostGxC.opacityEnabled.value,
            duration: const Duration(milliseconds: 300),
            child: PageView(
              // controller: _tabController,
              controller: _pageController,
              onPageChanged: (index) {
                selectedIndex = index;
                _onTabChanged(index, isFromPageView: true);
              },
              children: [
                UploadTab(
                  6,
                  photo_manager.RequestType.common,
                  createPostGxC: _createPostGxC,
                ),
                CameraTabV2(
                  navigateToGallery: () {},
                  createPostGxC: _createPostGxC,
                ),
                CreateTextTabV2(
                  createPostGxC: _createPostGxC,
                  defaultSelectedChallenge: widget.defaultSelectedChallenge,
                ),
                DraftTab(
                  defaultSelectedChallenge: widget.defaultSelectedChallenge,
                ),
              ],
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          await _onBackPressed();
          return false;
        },
        child: ChallengesTheme(
          child: Scaffold(
            backgroundColor: WildrColors.createPostBGColor(),
            resizeToAvoidBottomInset: false,
            extendBodyBehindAppBar: true,
            appBar: showAppAndTabBar
                ? _appBar()
                : PreferredSize(
                    preferredSize: Size.fromHeight(
                      AppBar().preferredSize.height,
                    ),
                    child: SizedBox(
                      height: AppBar().preferredSize.height,
                    ),
                  ),
            body: _body(),
            bottomNavigationBar: _bottomNavBar(),
          ),
        ),
      );

  @override
  void dispose() {
    _pageControllerForBottomTab.dispose();
    _pageController.dispose();
    _createPostGxC.clearAll();
    _selectAlbumGxC.clearAll();
    super.dispose();
  }
}
