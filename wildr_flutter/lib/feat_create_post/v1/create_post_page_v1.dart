import 'dart:io';
import 'dart:math';

import 'package:animated_widgets/widgets/opacity_animated.dart';
import 'package:animated_widgets/widgets/scale_animated.dart';
import 'package:auto_route/auto_route.dart';
import 'package:camera/camera.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/gxc/create_text_post_gxc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

part 'create_post_media_tab_v1.dart';
part 'create_post_text_tab_v1.dart';

void print(dynamic message) {
  debugPrint('CreatePostPage: $message');
}

class CreatePostPageV1 extends StatefulWidget {
  final MainBloc mainBloc;

  /// An optional challenge that signifies that this post is a challenge post.
  /// Will be the default challenged assigned when creating a post.
  final Challenge? defaultSelectedChallenge;

  const CreatePostPageV1({
    super.key,
    required this.mainBloc,
    this.defaultSelectedChallenge,
  });

  @override
  State<CreatePostPageV1> createState() => _CreatePostPageV1State();
}

class _CreatePostPageV1State extends State<CreatePostPageV1>
    with TickerProviderStateMixin {
  late final TabController _tabController;
  late final PageController _pageController;
  late final CreatePostGxC _createPostGxC;

  int _index = 0;
  final _cameraTabIndex = 0;
  late FocusNode _focusNode;
  late Color _indicatorColor; //To be set on the basis of tab index

  @override
  void initState() {
    Get.put(PostSettingsGxC());
    _indicatorColor = Colors.white70;
    _createPostGxC = Get.put(CreatePostGxC());
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _pageController = PageController();
    _focusNode = FocusNode();
    _createPostGxC.height = widget.mainBloc.height;
  }

  void _onTabChanged(int index, {isFromPageView = false}) {
    // Log tab change to analytics
    FirebaseAnalytics.instance.setCurrentScreen(
      screenName:
          "${CreatePostPageV1Route.name}/${index == _cameraTabIndex ? "Media" : "Text"}",
    );

    setState(() {
      _index = index;
      if (isFromPageView) {
        _tabController.animateTo(index);
      } else {
        _pageController.jumpToPage(index);
      }
      if (index == _cameraTabIndex) {
        _indicatorColor = Colors.white70;
        _focusNode.unfocus();
      } else {
        _indicatorColor = WildrColors.tabIndicatorColor();
      }
    });
  }

  void _onBackPressed() {
    _focusNode.unfocus();
    CreatePostCommon()
        .onCreatePostPageBackPressed(context, _createPostGxC)
        .then((value) {
      debugPrint(value.toString());
      if (value == false) {
        return;
      }
      Navigator.of(context).pop();
    });
  }

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is OpenCreatePostBottomSheetState) {
            if (state.shouldOpen) {
              _openBottomSheet();
            }
          } else if (state is CloseCreatePostPageState) {
            Navigator.of(context).pop();
          }
        },
        child: Obx(
          () => OpacityAnimatedWidget.tween(
            enabled: _createPostGxC.opacityEnabled.value,
            duration: const Duration(milliseconds: 300),
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) {
                _tabController.animateTo(index);
                _onTabChanged(index, isFromPageView: true);
              },
              children: [
                ColoredBox(
                  color: Colors.black,
                  child: CameraTabV1(
                    defaultSelectedChallenge: widget.defaultSelectedChallenge,
                    createPostGxC: _createPostGxC,
                  ),
                ),
                CreateTextTabV1(
                  focusNode: _focusNode,
                  defaultSelectedChallenge: widget.defaultSelectedChallenge,
                  createPostGxC: _createPostGxC,
                ),
              ],
            ),
          ),
        ),
      );

  Widget _counterButton() => Obx(
        () => ScaleAnimatedWidget.tween(
          animationFinished: (value) {
            if (value) {
              Future.delayed(const Duration(milliseconds: 300)).then(
                (value) {
                  _createPostGxC.animateCounter.value = false;
                  _createPostGxC.opacityEnabled.value = true;
                },
              );
            }
          },
          enabled: _createPostGxC.animateCounter.value,
          duration: const Duration(milliseconds: 100),
          scaleDisabled: 1,
          scaleEnabled: 1.8,
          child: CreatePostCommon().topRightCounter(
            _createPostGxC,
            onTap: () {
              _openBottomSheet();
            },
            c: _indicatorColor,
          ),
        ),
      );

  AppBar _appBar() => AppBar(
        centerTitle: true,
        iconTheme: IconThemeData(
          color: _index != _cameraTabIndex
              ? WildrColors.tabIndicatorColor()
              : Colors.white, //change your color here
        ),
        backgroundColor: _index != _cameraTabIndex
            ? (Get.theme.brightness == Brightness.light
                ? Colors.white
                : Get.theme.colorScheme.background)
            : Colors.black,
        leading: IconButton(
          icon: WildrIcon(
            WildrIcons.x_outline,
            color: _index != _cameraTabIndex
                ? WildrColors.tabIndicatorColor()
                : Colors.white,
          ),
          onPressed: _onBackPressed,
        ),
        title: TabBar(
          controller: _tabController,
          onTap: _onTabChanged,
          indicatorColor: _indicatorColor,
          labelColor: _indicatorColor,
          tabs: [
            Tab(
              icon: WildrIcon(
                WildrIcons.camera_filled,
                size: 25.0.w,
                color: _indicatorColor,
              ),
            ),
            Tab(
              icon: WildrIcon(
                WildrIcons.text_fields_filled,
                size: 25.0.w,
                color: _indicatorColor,
              ),
            ),
          ],
        ),
        actions: [_counterButton()],
      );

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          _onBackPressed();
          return false;
        },
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          extendBodyBehindAppBar: true,
          appBar: _appBar(),
          body: _body(),
        ),
      );

  void _openBottomSheet() {
    CreatePostCommon()
        .openPostsBottomSheetV1(
      context: context,
      createPostGxC: _createPostGxC,
    )
        .then((value) {
      switch (value) {
        case OPEN_PREVIEW_PAGE:
          context
              .pushRoute(
            PreviewMultiPostPageRoute(
              createPostGxC: _createPostGxC,
              shouldShowNextButton: false,
            ),
          )
              .then((value) {
            debugPrint('OPEN_PREVIEW_PAGE = $value');
            if (value == SHOULD_CALL_SET_STATE) {
              setState(() {});
            }
          });
        case OPEN_PREVIEW_PAGE_WITH_NEXT_BUTTON:
          context
              .pushRoute(
            PreviewMultiPostPageRoute(createPostGxC: _createPostGxC),
          )
              .then((value) {
            setState(() {});
          });
        case OPEN_UPLOAD_PAGE:
          context
              .pushRoute(
            UploadMultiMediaPostV1Route(
              createPostGxC: _createPostGxC,
              defaultSelectedChallenge: widget.defaultSelectedChallenge,
            ),
          )
              .then((value) {
            if (value == SHOULD_CALL_SET_STATE) {
              setState(() {});
            } else if (value == POP_CURRENT_PAGE) {
              Navigator.of(context).pop();
            }
          });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pageController.dispose();
    _focusNode.dispose();
    _createPostGxC.clearAll();
    super.dispose();
  }
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
