// ignore_for_file: use_build_context_synchronously

import 'dart:io';
import 'dart:math';
import 'dart:ui';

import 'package:align_positioned/align_positioned.dart';
import 'package:auto_route/auto_route.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:dots_indicator/dots_indicator.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_email_sender/flutter_email_sender.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_image/flutter_image.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:get/get.dart';
import 'package:image/image.dart' as pkg_img;
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/ext_image_view/wildr_cache_manager.dart';
import 'package:wildr_flutter/common/send_feedback_api.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';
import 'package:wildr_flutter/dialogs/confirmation_dialog.dart';
import 'package:wildr_flutter/feat_app_update_banner/app_update_body.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/challenge_shimmer_card.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_notifications/model/user_activity.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_wrapper.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_gxc.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/home/model/wildr_verified.dart';
import 'package:wildr_flutter/login_signup/login_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/utils/profile_image_cropper.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

part 'ext_challenge/challenge_common_ext.dart';
part 'ext_image_providers/image_providers_common_ext.dart';
part 'ext_image_view/image_view_common_ext.dart';

const String kPos = 'position';
const String kType = 'segmentType';
const String kUserId = 'userId';

class Common {
  static final Common _instance = Common._internal();

  factory Common() => _instance;

  Common._internal();

  Future<File?> pickProfileImageAndCrop(
    BuildContext context,
    ImageSource source,
  ) async {
    try {
      final hasPermissions = source == ImageSource.gallery
          ? await checkAndRequestPhotosPermissions(context)
          : await checkAndRequestCameraPermissions(context);
      if (!hasPermissions) {
        debugPrint('[pickProfileImageAndCrop] Does not have permissions');
        return null;
      }
      final XFile? pickedFile = await ImagePicker().pickImage(
        source: source,
        preferredCameraDevice: CameraDevice.front,
      );
      if (pickedFile != null) {
        String path = pickedFile.path;
        final CroppedFile? croppedFile =
            await ProfileImageCropper.cropImage(pickedFile.path);
        if (croppedFile == null) return null;
        path = croppedFile.path;
        return File(path);
      }
    } catch (exception, stack) {
      debugPrint('[pickProfileImageAndCrop]: $exception');
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: 'pickProfileImageAndCrop',
      );
      debugPrintStack(stackTrace: stack);
    }
    return null;
  }

  Future<bool> checkAndRequestCameraPermissions(BuildContext context) async {
    debugPrint('requestCameraPermissions');
    final PermissionStatus status = await Permission.camera.status;
    if (status.isGranted) {
      return true;
    } else if (status.isPermanentlyDenied) {
      showSnackBar(
        context,
        AppLocalizations.of(context)!.comm_cameraPermissionRequest,
        action: SnackBarAction(
          label: AppLocalizations.of(context)!.comm_cap_settings,
          onPressed: openAppSettings,
          backgroundColor: WildrColors.primaryColor,
          textColor: WildrColors.white,
        ),
      );
      return false;
    } else {
      // Permission has not been requested yet, ask for permission
      final PermissionStatus newStatus = await Permission.camera.request();
      return newStatus.isGranted;
    }
  }

  Future<bool> checkAndRequestPhotosPermissions(BuildContext context) async {
    debugPrint('requestPhotosPermissions');
    final PermissionStatus status = await getPhotosPermissionStatus();
    debugPrint('Status $status');
    if (status.isGranted) {
      return true;
    } else if (status.isPermanentlyDenied) {
      showSnackBar(
        context,
        AppLocalizations.of(context)!
            .wildr_verify_enablePhotoPermissionsInstruction,
        action: SnackBarAction(
          label: AppLocalizations.of(context)!.comm_cap_settings,
          onPressed: openAppSettings,
          backgroundColor: WildrColors.primaryColor,
          textColor: WildrColors.white,
        ),
      );
      return false;
    } else {
      // Permission has not been requested yet, ask for permission
      final PermissionStatus newStatus = await requestPhotosPermission();
      return newStatus.isGranted;
    }
  }

  Future<PermissionStatus> getPhotosPermissionStatus() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt < 33) {
        return await Permission.storage.status;
      }
    }
    return await Permission.photos.status;
  }

  Future<PermissionStatus> requestPhotosPermission() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt < 33) {
        return await Permission.storage.request();
      }
    }
    return await Permission.photos.request();
  }

  Widget get defaultClassicHeader => const ClassicHeader(
        releaseText: 'Release to refresh',
        idleText: 'Pull down to refresh',
      );

  Widget wrapInShimmer(
    Widget child, {
    BuildContext? context,
    bool enabled = true,
  }) {
    final bool isDarkMode;
    if (context != null) {
      isDarkMode = Theme.of(context).brightness == Brightness.dark;
    } else {
      isDarkMode = Get.isDarkMode;
    }
    final baseColor = isDarkMode ? Colors.grey[700]! : Colors.grey[300]!;
    final highlightColor = isDarkMode ? Colors.grey[500]! : Colors.grey[100]!;
    return Shimmer.fromColors(
      period: shimmerPeriod,
      baseColor: baseColor,
      enabled: enabled,
      highlightColor: highlightColor,
      child: child,
    );
  }

  EdgeInsets textPostPadding(
    BuildContext context, {
    double addToBottom = 0.0,
  }) =>
      EdgeInsets.only(
        left: 8,
        right: 8,
        top: MediaQuery.of(context).padding.top * 0.85,
        bottom: MediaQuery.of(context).padding.bottom + addToBottom + 20.0.w,
      );

  bool isEmpty(String? str) => str == null || str.isEmpty;

  bool isNotEmpty(String? str) => str != null && str.isNotEmpty;

  final FetchStrategy _defaultFetchStrategyFunction =
      const FetchStrategyBuilder(
    timeout: Duration(seconds: 60),
    totalFetchTimeout: Duration(minutes: 3),
  ).build();

  Future<FetchInstructions> defaultFetchStrategy(
    Uri uri,
    FetchFailure? failure,
  ) =>
      _defaultFetchStrategyFunction(uri, failure);

  bool isLoggedIn(BuildContext context) => mainBloc(context).isLoggedIn;

  bool get isUserInPrefs =>
      Prefs.getString(PrefKeys.kCurrentUserWithToken) != null;

  String currentUserId(context) => mainBloc(context).currentUser.id;

  WildrUser currentUser(context) => mainBloc(context).currentUser;

  void showSnackBar(
    BuildContext context,
    String message, {
    Color? color,
    bool isDisplayingError = false,
    int millis = 3000,
    bool showIcon = false,
    Widget? icon,
    SnackBarAction? action,
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: color ??
            (isDisplayingError
                ? WildrColors.snackBarErrorColor
                : const Color(0xff54545D)),
        content: Row(
          children: [
            if (showIcon)
              icon ??
                  WildrIcon(
                    WildrIcons.exclamation_circle_outline,
                    color: WildrColors.textColor(context),
                  ),
            if (showIcon) const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        duration: Duration(milliseconds: millis),
        behavior: SnackBarBehavior.floating,
        action: action,
      ),
    );
  }

  void showSomethingWentWrong([BuildContext? context]) {
    if (context != null) {
      showSnackBar(context, kSomethingWentWrong, isDisplayingError: true);
      return;
    }
    showErrorSnackBar(kSomethingWentWrong);
  }

  void showErrorSnackBar(String message, [BuildContext? context]) {
    if (context != null) {
      showSnackBar(context, message, isDisplayingError: true);
      return;
    }
    showGetSnackBar(message, isDisplayingError: true);
  }

  void justShowWarningDialog(
    BuildContext context, {
    String title = 'Attention!',
    required String message,
  }) {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.warning,
      btnOkText: AppLocalizations.of(context)!.comm_gotIt,
      btnOkColor: WildrColors.primaryColor,
      btnOkOnPress: () {},
      title: title,
      headerAnimationLoop: false,
      useRootNavigator: true,
      desc: message,
    ).show();
  }

  double getBottomPadding(double bottomPadding) {
    if (bottomPadding.h == 0.0) {
      return bottomPadding.h + Get.height * 0.02;
    } else {
      return bottomPadding.h;
    }
  }

  AppBar appbarWithActions({required String title, List<Widget>? actions}) =>
      AppBar(
        title: Text(title),
        actions: actions,
      );

  Future<void> showSuccessDialog(
    BuildContext context, {
    required String message,
    String? secondLine,
    String? title,
  }) =>
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const SuccessLogo(),
          title: title ?? AppLocalizations.of(context)!.comm_cap_success,
          description: message,
          questionText: secondLine,
        ),
      );

  Future<dynamic> showAppUpdateDialog(BuildContext context) => showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => const AppUpdateBody(),
      );

  Widget legalMinimumAgeConsentCopy(BuildContext context) {
    final Color getTextColor = Theme.of(context).brightness == Brightness.dark
        ? Colors.white
        : Colors.black;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: 'By continuing, you affirm you are ',
                style: TextStyle(
                  fontSize: 12,
                  color: getTextColor,
                ),
              ),
              TextSpan(
                text: '$kAppMinimumAge years or older ',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: getTextColor,
                ),
              ),
              TextSpan(
                text: 'and agree to the ',
                style: TextStyle(
                  fontSize: 12,
                  color: getTextColor,
                ),
              ),
              TextSpan(
                text: 'Terms',
                style: const TextStyle(
                  color: Colors.blue,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                recognizer: TapGestureRecognizer()
                  ..onTap = () => context.pushRoute(
                        const TermsOfServicePageRoute(),
                      ),
              ),
              TextSpan(
                text: ', ',
                style: TextStyle(
                  fontSize: 12,
                  color: getTextColor,
                ),
              ),
              TextSpan(
                text: 'Privacy Policy',
                style: const TextStyle(
                  color: Colors.blue,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                recognizer: TapGestureRecognizer()
                  ..onTap = () => context.pushRoute(
                        const PrivacyPolicyPageRoute(),
                      ),
              ),
              TextSpan(
                text: ', and ',
                style: TextStyle(
                  fontSize: 12,
                  color: getTextColor,
                ),
              ),
              TextSpan(
                text: 'Community Guidelines',
                style: const TextStyle(
                  color: Colors.blue,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                recognizer: TapGestureRecognizer()
                  ..onTap = () => context.pushRoute(
                        CommunityGuidelinesPageRoute(),
                      ),
              ),
            ],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Future<dynamic> showTrollDetectedDialog(
    BuildContext context, {
    required object,
    VoidCallback? onYesTap,
    String? leftButtonText,
  }) =>
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const ErrorLogo(),
          title: 'Did you mean to say that?',
          description: 'Our AI is still learning and thinks this may be toxic.'
              ' Do you still want to $object this?',
          leftButtonText: leftButtonText ?? 'No',
          isLeftButtonSolid: true,
          leftButtonOnPressed: () => Navigator.of(context).pop(),
          rightButtonText: AppLocalizations.of(context)!.comm_cap_yes,
          rightButtonColor: WildrColors.errorColor,
          isRightButtonSolid: false,
          rightButtonOnPressed: () {
            Navigator.of(context).pop(true);
            if (onYesTap != null) {
              onYesTap();
            } else {
              debugPrint(
                '[trollDetectedDialog] No `onYesTap` callback found',
              );
            }
          },
        ),
      );

  Future<void> showDeleteDialog(
    BuildContext context, {
    required String object,
    VoidCallback? onYesTap,
  }) =>
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const DeleteLogo(),
          title: 'Delete $object',
          description:
              'Are you sure you want to delete this ${object.toLowerCase()}?',
          // questionText: "Do you want to discard all your progress?",
          leftButtonText: AppLocalizations.of(context)!.comm_cap_no,
          leftButtonColor: WildrColors.errorColor,
          leftButtonOnPressed: () {
            Navigator.of(context).pop();
          },
          rightButtonText: AppLocalizations.of(context)!.comm_cap_yes,
          rightButtonColor: WildrColors.errorColor,
          rightButtonOnPressed: () {
            Navigator.of(context).pop();
            if (onYesTap != null) {
              onYesTap();
            } else {
              debugPrint('[showDeleteDialog] No `onYesTap` callback found');
            }
          },
        ),
      );

  Future<void> showAreYouSureDialog(
    BuildContext context, {
    required String title,
    required String text,
    bool showAreYouSurePrefix = true,
    VoidCallback? onYesTap,
  }) =>
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const QuestionLogo(),
          title: title,
          description: showAreYouSurePrefix
              ? 'Are you sure you want to ${text.toLowerCase()}?'
              : text,
          // questionText: "Do you want to discard all your progress?",
          leftButtonText: AppLocalizations.of(context)!.comm_cap_no,
          leftButtonColor: WildrColors.errorColor,
          leftButtonOnPressed: () {
            Navigator.of(context).pop();
          },
          rightButtonText: AppLocalizations.of(context)!.comm_cap_yes,
          rightButtonColor: WildrColors.errorColor,
          rightButtonOnPressed: () {
            Navigator.of(context).pop();
            if (onYesTap != null) {
              onYesTap();
            } else {
              debugPrint('[showDeleteDialog] No `onYesTap` callback found');
            }
          },
        ),
      );

  void showDialogWithLogo(
    BuildContext context, {
    required Widget logo,
    String? title,
    String? description,
  }) {
    showDialog(
      useRootNavigator: true,
      context: context,
      builder: (context) => CustomDialogBox(
        logo: logo,
        title: title,
        description: description,
      ),
    );
  }

  void showAttentionDialog(
    BuildContext context, {
    String? title,
    String? description,
  }) {
    showDialog(
      useRootNavigator: true,
      context: context,
      builder: (context) => CustomDialogBox(
        logo: const AttentionLogo(),
        title: title,
        description: description,
      ),
    );
  }

  Future<void> showErrorDialog(
    BuildContext context, {
    String? title,
    String? description,
  }) =>
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const ErrorLogo(),
          title: title,
          description: description,
        ),
      );

  void showConfirmationSnackBar(String message, [BuildContext? context]) {
    if (context != null) {
      showSnackBar(
        context,
        message,
        color: WildrColors.primaryColor,
      );
      return;
    }
    showGetSnackBar(
      message,
      backgroundColor: WildrColors.primaryColor,
      messageTextColor: Colors.white,
    );
  }

  // @Deprecated('Use [showSnackBar] instead')
  void showGetSnackBar(
    String message, {
    String? title,
    Color? backgroundColor,
    Color? messageTextColor,
    bool isDisplayingError = false,
    int millis = 3000,
    bool showIcon = false,
    Widget? icon,
    SnackPosition snackPosition = SnackPosition.BOTTOM,
  }) {
    Get.showSnackbar(
      GetSnackBar(
        title: title,
        messageText: Row(
          children: [
            if (showIcon)
              Padding(
                padding: const EdgeInsets.all(2.0),
                child: icon ??
                    const WildrIcon(
                      WildrIcons.exclamation_circle_outline,
                    ),
              ),
            if (showIcon) const SizedBox(width: 10),
            Expanded(
              child: Text(
                message.substring(0, min(message.length, 100)),
                style: isDisplayingError
                    ? const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                      )
                    : TextStyle(
                        color:
                            messageTextColor ?? WildrColors.tabIndicatorColor(),
                      ),
              ),
            ),
          ],
        ),
        backgroundColor: backgroundColor ??
            (isDisplayingError
                ? WildrColors.snackBarErrorColor
                : Get.theme.colorScheme.background),
        // barBlur: 0.6,
        // overlayBlur: 0.2,
        forwardAnimationCurve: Curves.easeOut,
        duration: Duration(milliseconds: millis),
        snackPosition: snackPosition,
      ),
    );
  }

  MainBloc mainBloc(BuildContext context) => BlocProvider.of<MainBloc>(context);

  Future<void> openLoginPage(
    StackRouter router, {
    bool isSignup = false,
    Function(dynamic)? callback,
  }) =>
      router.push(OnboardingV3PageRoute()).then((value) {
        callback?.call(value);
      });

  void openLoginPageUsingGet() {
    Get.to(() => const LoginPage(isOpenedUsingGet: true));
  }

  Future<String> getCompressedOutPath(String filePath) async {
    final lastIndex = filePath.lastIndexOf('/');
    final fileName = filePath.substring(lastIndex + 1, filePath.length);
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final String path = '${documentsDirectory.path}/compressed_$fileName';
    return path.replaceRange(path.lastIndexOf('.'), path.length, '.webp');
  }

  Future<String> getCompressedThumbnailOutPath(String filePath) async {
    final lastIndex = filePath.lastIndexOf('/');
    final fileName = filePath.substring(lastIndex + 1, filePath.length);
    final documentsDirectory = await getApplicationDocumentsDirectory();
    // return "${documentsDirectory.path}/thumb_$fileName";
    final String path = '${documentsDirectory.path}/thumb_$fileName';
    return path.replaceRange(path.lastIndexOf('.'), path.length, '.webp');
  }

  Future<String> getFileSize(String filepath, int decimals) async {
    final file = File(filepath);
    final int bytes = await file.length();
    if (bytes <= 0) return '0 B';
    const suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    final i = (log(bytes) / log(1024)).floor();
    return '${(bytes / pow(1024, i)).toStringAsFixed(decimals)} ${suffixes[i]}';
  }

  LottieBuilder loadingLottieAnimation() =>
      Lottie.asset('assets/animations/loader.json');

  Widget wrapItWithRing({
    required Widget child,
    required double? score,
    required int currentStrikeCount,
    double ringWidth = 3,
    double ringDiff = 3,
    double? padding,
    Color? bgColor,
  }) =>
      Container(
        padding: EdgeInsets.all(padding ?? ringWidth), //Ring Width
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            width: ringWidth,
            color: ProfilePageCommon().ringColor(score, currentStrikeCount),
          ),
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              width: ringDiff,
              color: bgColor ?? const Color(0x0DFFFFFF),
            ),
          ),
          child: Container(
            child: child,
          ),
        ),
      );

  Widget closeFriendsAvatarWrapper(
    Widget child, {
    required bool shouldShow,
  }) =>
      shouldShow
          ? Stack(
              children: [
                AlignPositioned.relative(
                  container: child,
                  child: const WildrIconPng(
                    WildrIconsPng.inner_circle,
                    size: 20,
                  ),
                  moveByContainerHeight: .35,
                  moveByContainerWidth: .35,
                ),
              ],
            )
          : child;

  Widget avatarFromAuthor(
    BuildContext context,
    Author? pAuthor, {
    double radius = 25,
    bool shouldNavigateToCurrentUser = true,
    Function? onTapAdditional,
    double ringWidth = 1.5,
    double ringDiff = 3,
    bool shouldWrapInCloseFriendsIcon = true,
    double? fontSize,
    bool shouldShowRing = true,
  }) {
    final Author author = pAuthor ?? Author.placeholder();
    final circleAvatar = CircleAvatar(
      backgroundColor: WildrColors.primaryColor,
      radius: radius,
      backgroundImage: getAvatarImageProvider(author.avatarImage),
      child: (author.avatarImage?.url == null)
          ? Text(
              author.handle.substring(0, 2).toUpperCase(),
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: fontSize ?? radius / 1.3,
              ),
            )
          : null,
    );
    return GestureDetector(
      onTap: () {
        final authorId = author.id;
        openProfilePage(
          context,
          authorId,
          shouldNavigateToCurrentUser: shouldNavigateToCurrentUser,
          author: author,
        );
        if (onTapAdditional != null) onTapAdditional();
      },
      child: !shouldShowRing
          ? circleAvatar
          : closeFriendsAvatarWrapper(
              wrapItWithRing(
                child: circleAvatar,
                currentStrikeCount: author.currentStrikeCount,
                score: author.score,
                ringWidth: ringWidth,
                ringDiff: ringDiff,
              ),
              shouldShow: author.isInInnerCircle,
            ),
    );
  }

  Widget avatarFromUser(
    BuildContext? context,
    WildrUser user, {
    double radius = 28,
    bool shouldNavigateToCurrentUser = true,
    double ringDiff = 2,
    double ringWidth = 2,
    bool shouldWrapInCloseFriendsIcon = true,
    bool shouldShowRing = true,
    bool shouldNavigateToProfile = true,
  }) {
    final Widget circleAvatar = FittedBox(
      child: CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: radius,
        backgroundImage: user.avatarImage?.url != null
            ? Image.network(
                user.avatarImage!.url!,
                errorBuilder: (_, __, ___) =>
                    Image.asset('assets/images/user_placeholder.png'),
              ).image
            : null,
        child: user.avatarImage?.url == null
            ? Text(
                user.handle.substring(0, 2).toUpperCase(),
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: radius / 1.5,
                ),
              )
            : null,
      ),
    );
    if (!shouldShowRing) return circleAvatar;
    return closeFriendsAvatarWrapper(
      GestureDetector(
        onTap: !shouldNavigateToProfile
            ? null
            : () {
                final userId = user.id;
                if (context != null) {
                  openProfilePage(
                    context,
                    userId,
                    shouldNavigateToCurrentUser: shouldNavigateToCurrentUser,
                    user: user,
                  );
                }
              },
        child: wrapItWithRing(
          child: circleAvatar,
          ringDiff: ringDiff,
          ringWidth: ringWidth,
          currentStrikeCount: user.strikeData.currentStrikeCount,
          score: user.score,
        ),
      ),
      shouldShow: shouldWrapInCloseFriendsIcon && user.isInInnerCircle,
    );
  }

  Future<void>? openProfilePage(
    BuildContext context,
    String authorId, {
    WildrUser? user,
    Author? author,
    bool shouldNavigateToCurrentUser = true,
  }) {
    if (currentUser(context).id == authorId) {
      if (shouldNavigateToCurrentUser) {
        mainBloc(context).add(NavigateToTabEvent(HomeTab.PROFILE));
        return null;
      } else {
        return context.pushRoute(
          CurrentUserProfilePageRoute(
            shouldShowBackButtonAndRefresh: true,
          ),
        );
      }
    }
    return context.pushRoute(
      ProfilePageRoute(
        idOfUserToFetch: authorId,
        userObj: user ?? (author == null ? null : WildrUser.fromAuthor(author)),
      ),
    );
  }

  Post currentPost({FeedGxC? feedGxC}) {
    if (feedGxC != null) {
      return feedGxC.currentPost;
    }
    final FeedGxC controller = Get.find();
    return controller.currentPost;
  }

  TextStyle actionSheetTextStyle({
    Color? color,
    FontWeight? fontWeight,
    BuildContext? context,
  }) =>
      TextStyle(
        fontSize: 18,
        color: color ?? WildrColors.textColorStrong(context),
        fontWeight: fontWeight,
      );

  Widget actionSheetDivider() => divider(
        color: Get.isDarkMode ? const Color(0xFF424242) : Colors.grey[300]!,
      );

  Future<void> showActionSheet(
    BuildContext context,
    List<Widget> children, {
    Color? backgroundColor,
    String? bottomButtonText,
    Color? bottomButtonColor,
    FontWeight? bottomButtonFontWeight,
    Function? bottomButtonCallback,
  }) {
    final BoxDecoration decoration = BoxDecoration(
      borderRadius: BorderRadius.circular(15),
      color: Theme.of(context).brightness == Brightness.light
          ? Colors.grey[200]
          : WildrColors.darkCardColor,
    );
    return showCupertinoModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.background,
      builder: (context) => SafeArea(
        child: Material(
          child: Container(
            // margin: margin,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: Get.width,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  // margin: margin,
                  decoration: decoration,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: children,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  width: Get.width,
                  decoration: decoration,
                  child: TextButton(
                    child: Text(
                      bottomButtonText ??
                          AppLocalizations.of(context)!.comm_cap_cancel,
                      style: actionSheetTextStyle(
                        color: bottomButtonColor,
                        fontWeight: bottomButtonFontWeight,
                      ),
                    ),
                    onPressed: () {
                      Navigator.of(context).pop();
                      if (bottomButtonCallback != null) {
                        bottomButtonCallback();
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  BoxDecoration curveDecoration({double radius = 15}) => BoxDecoration(
        color: Get.theme.colorScheme.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(radius),
          topRight: Radius.circular(radius),
        ),
      );

  void showReportItBottomSheet({
    required BuildContext context,
    required ReportObjectTypeEnum reportObjectType,
    Function(ReportTypeEnum)? callback,
    Function(ReportUserEnum)? reportUserCallback,
  }) {
    const Radius radius = Radius.circular(20);
    ReportTypeEnum reportTypeEnum = ReportTypeEnum.values.first;
    ReportUserEnum reportUserEnum = ReportUserEnum.values.first;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is ReportSomethingState) {
            if (state.errorMessage == null) {
              Navigator.pop(context);
            } else if (state.errorMessage!.contains('again')) {
              Navigator.pop(context);
            }
          }
        },
        child: StatefulBuilder(
          builder: (context, updatedSetState) {
            final List<Widget> children = [
              const Padding(padding: EdgeInsets.only(top: 10)),
              ListTile(
                dense: true,
                title: Text(
                  'Reason for reporting this ${reportObjectType.value()}?',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: WildrColors.textColorStrong(context),
                    fontSize: 18,
                  ),
                ),
                trailing: WildrIconButton(
                  WildrIcons.x_filled,
                  color: WildrColors.textColor(),
                  size: 20,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              ),
            ];
            final List<Widget> list = [];
            if (reportObjectType == ReportObjectTypeEnum.USER) {
              for (final value in ReportUserEnum.values) {
                list
                  ..add(
                    ListTile(
                      contentPadding:
                          const EdgeInsets.only(left: 25, right: 20),
                      title: Text(
                        value.displayStr(),
                        style: TextStyle(
                          color: WildrColors.textColorStrong(context),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      trailing: Radio<ReportUserEnum>(
                        value: value,
                        groupValue: reportUserEnum,
                        activeColor: WildrColors.errorColor,
                        onChanged: (_) {
                          reportUserEnum = value;
                          updatedSetState(() {});
                        },
                      ),
                      onTap: () {
                        reportUserEnum = value;
                        updatedSetState(() {});
                      },
                    ),
                  )
                  ..add(
                    Container(height: 0.3, color: WildrColors.separatorColor()),
                  );
              }
            } else {
              for (final value in ReportTypeEnum.values) {
                list
                  ..add(
                    ListTile(
                      contentPadding:
                          const EdgeInsets.only(left: 25, right: 20),
                      title: Text(
                        value.displayStr(context),
                        style: TextStyle(
                          color: WildrColors.textColorStrong(context),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      trailing: Radio<ReportTypeEnum>(
                        value: value,
                        groupValue: reportTypeEnum,
                        activeColor: WildrColors.errorColor,
                        onChanged: (_) {
                          reportTypeEnum = value;
                          updatedSetState(() {});
                        },
                      ),
                      onTap: () {
                        reportTypeEnum = value;
                        updatedSetState(() {});
                      },
                    ),
                  )
                  ..add(
                    Container(height: 0.3, color: WildrColors.separatorColor()),
                  );
              }
            }
            list.removeLast();
            children
              ..addAll(list)
              ..add(
                Center(
                  child: Container(
                    padding: const EdgeInsets.only(top: 15, bottom: 5),
                    width: Get.width * 0.9,
                    child: ElevatedButton(
                      style:
                          Common().buttonStyle(color: WildrColors.errorColor),
                      onPressed: () {
                        callback?.call(reportTypeEnum);
                        reportUserCallback?.call(reportUserEnum);
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        AppLocalizations.of(context)!.comm_cap_submit,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            return DecoratedBox(
              decoration: BoxDecoration(
                color: Get.theme.colorScheme.background,
                borderRadius: const BorderRadius.only(
                  topLeft: radius,
                  topRight: radius,
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: children,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> showFeedbackDetailsDialog(context) async {
    await showDialog(
      useRootNavigator: false,
      context: context,
      builder: (context) => WillPopScope(
        onWillPop: () async {
          await Prefs.setBool(PrefKeys.kHasSeenShakeForFeedback, value: true);
          return true;
        },
        child: CustomDialogBox(
          logo: const AttentionLogo(color: WildrColors.primaryColor),
          title: AppLocalizations.of(context)!.comm_feedbackPrompt,
          description: AppLocalizations.of(context)!.comm_feedbackShakePrompt,
          onExitPressed: () {
            Prefs.setBool(PrefKeys.kHasSeenShakeForFeedback, value: true);
            Navigator.pop(context);
          },
          centerButtonText: AppLocalizations.of(context)!.comm_cap_okay,
        ),
      ),
    );
  }

  Widget _textOr() => Container(
        margin: EdgeInsets.only(top: Get.height * 0.02),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 65,
              ),
              Expanded(
                child: Common().divider(),
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                'Or',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: Get.height * 0.02,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(
                width: 10,
              ),
              Expanded(
                child: Common().divider(),
              ),
              const SizedBox(
                width: 65,
              ),
            ],
          ),
        ),
      );

  Future<void> showFeedbackBottomSheet(context) async {
    final TextEditingController controller = TextEditingController();
    bool isLoading = false;
    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(15),
          topRight: Radius.circular(15),
        ),
      ),
      isScrollControlled: true,
      enableDrag: false,
      isDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, updatedSetState) => SingleChildScrollView(
          child: WillPopScope(
            onWillPop: () async {
              Common().mainBloc(context).feedBackDialogOpen = false;
              return true;
            },
            child: Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 0.0),
                // content padding
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: () {
                            Common().mainBloc(context).feedBackDialogOpen =
                                false;
                            Navigator.pop(context);
                          },
                          child: Text(
                            AppLocalizations.of(context)!.comm_cap_cancel,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          AppLocalizations.of(context)!.comm_cap_feedback,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 20,
                          ),
                        ),
                        Flexible(
                          child: TextButton(
                            style: TextButton.styleFrom(
                              splashFactory: controller.text.isEmpty
                                  ? InkSplash.splashFactory
                                  : NoSplash.splashFactory,
                            ),
                            onPressed: () async {
                              final String text = controller.text;
                              if (text.isEmpty) {
                                Common().showErrorSnackBar(
                                  AppLocalizations.of(context)!
                                      .comm_emptyFeedbackError,
                                );
                                return;
                              }
                              updatedSetState(() {
                                isLoading = true;
                              });

                              try {
                                final String response =
                                    await FeedbackApi.sendFeedback(
                                  text,
                                );
                                Common().showSnackBar(context, response);
                              } catch (error) {
                                Common().showErrorSnackBar(
                                  kSomethingWentWrong,
                                );
                              }
                              updatedSetState(() {
                                isLoading = false;
                              });
                              Common().mainBloc(context).feedBackDialogOpen =
                                  false;
                              Navigator.pop(context);
                            },
                            child: isLoading
                                ? const CircularProgressIndicator()
                                : Text(
                                    AppLocalizations.of(context)!.comm_cap_send,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),
                    Text(
                      AppLocalizations.of(context)!
                          .comm_feedbackExplanationPrompt,
                      style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                    ),
                    TextField(
                      keyboardType: TextInputType.multiline,
                      controller: controller,
                      minLines: 1,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: '',
                        hintText: '',
                      ),
                    ),
                    const SizedBox(height: 25),
                    _textOr(),
                    const SizedBox(height: 25),
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.7,
                      child: ElevatedButton(
                        style: ButtonStyle(
                          backgroundColor: MaterialStateProperty.all<Color>(
                            WildrColors.primaryColor,
                          ),
                          shape: MaterialStateProperty.all(
                            RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15.0),
                            ),
                          ),
                        ),
                        onPressed: () async {
                          final Email email = Email(
                            body:
                                '<div>Hello Wildr Team,</div><div>${controller.text}</div>',
                            recipients: ['feedback@wildr.com'],
                            isHTML: true,
                          );
                          try {
                            await FlutterEmailSender.send(email);
                          } catch (e) {
                            debugPrint('🔴 $e');
                            Common().showGetSnackBar(
                              AppLocalizations.of(context)!
                                  .comm_errorOopsMessage,
                            );
                          }
                          Common().mainBloc(context).feedBackDialogOpen = false;
                          Navigator.pop(context);
                        },
                        child: Text(
                          AppLocalizations.of(context)!.comm_sendViaEmail,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(
                      height: 50,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ), // From with TextField inside
      ),
    );
  }

  Future<void> delayItBySeconds(Function callback, {int seconds = 4}) =>
      Future.delayed(Duration(seconds: seconds)).then((value) {
        callback();
      });

  /// A convenience wrapper for [Navigator.push].
  /// If pushing a new route/page, prefer using [pushRoute] instead.
  @Deprecated(
    'For navigation, use auto_route and its `pushRoute` method instead',
  )
  Future<T?> push<T extends Object?>(
    Widget page,
    BuildContext context, {
    Duration duration = const Duration(milliseconds: 300),
    Alignment? alignment,
  }) =>
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => page,
        ),
      );

  void handleNotificationTap(
    Map<String, dynamic> dataPayload,
    BuildContext? context,
  ) {
    if (context == null) {
      debugPrint('handleNotificationTap() CONTEXT = null');
      return;
    }
    debugPrint('handleNotificationTap Payload = $dataPayload');
    final UserActivityVerbEnum verb =
        UserActivity.getVerb(dataPayload['verb'] ?? '');
    final String? routeName = dataPayload['route'];
    Common().mainBloc(context).logCustomEvent(
      AnalyticsEvents.kNotificationPressed,
      {
        AnalyticsParameters.kVerb: verb.name,
        AnalyticsParameters.kMarketing:
            dataPayload[AnalyticsParameters.kMarketing] ?? '',
        AnalyticsParameters.kRouteName: routeName,
        'postId': dataPayload['postId'],
        'repostId': dataPayload['repostId'],
        'commentId': dataPayload['commentId'],
        'replyId': dataPayload['replyId'],
        'challengeId': dataPayload['challengeId'],
        'followerId': dataPayload['followerId'],
        'subjectId': dataPayload['subjectId'],
        'reviewRequestId': dataPayload['reviewRequestId'],
      },
    );
    // Handle payloads requesting to navigate to a specific route.
    if (routeName != null) {
      try {
        if (routeName == 'CHALLENGE_ONBOARDING/CHALLENGE_HOME_TAB') {
          context.router.popUntilRoot();
          Common()
              .mainBloc(context)
              .add(NavigateToTabEvent(HomeTab.CHALLENGES));
        } else {
          context.router.pushNamed(routeName);
        }
      } catch (e) {
        showErrorSnackBar(kSomethingWentWrong);
        // Rethrow the error so that it can be caught by Crashlytics.
        rethrow;
      }
    }
    debugPrint('Verb = $verb');
    switch (verb) {
      case UserActivityVerbEnum.UNKNOWN:
        Common().showAppUpdateDialog(context);
      case UserActivityVerbEnum.REACTION_LIKE:
      case UserActivityVerbEnum.REACTION_REAL:
      case UserActivityVerbEnum.REACTION_APPLAUD:
      case UserActivityVerbEnum.REPOSTED:
      case UserActivityVerbEnum.POSTED:
      case UserActivityVerbEnum.MENTIONED_IN_POST:
        final String? postId = dataPayload['postId'] ?? dataPayload['repostId'];
        final int postPageIndex =
            int.parse(dataPayload['postPageIndex'] ?? '0');
        final String? commentId = dataPayload['commentId'];
        final String? replyId = dataPayload['replyId'];
        final String? challengeId = dataPayload['challengeId'];
        if (postId != null) {
          context.pushRoute(
            SinglePostPageRoute(
              postId: postId,
              postPageIndex: postPageIndex,
              commentToNavigateToId: commentId,
              replyToNavigateToId: replyId,
            ),
          );
        } else if (challengeId != null) {
          context.pushRoute(
            SingleChallengePageRoute(
              challengeId: challengeId,
              commentToNavigateToId: commentId,
              replyToNavigateToId: replyId,
            ),
          );
        }
      case UserActivityVerbEnum.COMMENTED:
      case UserActivityVerbEnum.MENTIONED_IN_COMMENT:
        final String? postId = dataPayload['postId'];
        final String? commentId = dataPayload['commentId'];
        final String? challengeId = dataPayload['challengeId'];
        if (postId != null) {
          context.pushRoute(
            SinglePostPageRoute(
              postId: postId,
              commentToNavigateToId: commentId,
            ),
          );
        } else if (challengeId != null) {
          context.pushRoute(
            SingleChallengePageRoute(
              challengeId: challengeId,
              commentToNavigateToId: commentId,
            ),
          );
        }
      case UserActivityVerbEnum.REPLIED:
      case UserActivityVerbEnum.MENTIONED_IN_REPLY:
        final String? postId = dataPayload['postId'];
        final String? challengeId = dataPayload['challengeId'];
        final String? commentId = dataPayload['commentId'];
        final String? replyId = dataPayload['replyId'];
        debugPrint('MENTIONED IN REPLY $replyId and comment id $commentId');
        if (postId != null) {
          context.pushRoute(
            SinglePostPageRoute(
              postId: postId,
              commentToNavigateToId: commentId,
              replyToNavigateToId: replyId,
            ),
          );
        } else if (challengeId != null) {
          context.pushRoute(
            SingleChallengePageRoute(
              challengeId: challengeId,
              commentToNavigateToId: commentId,
              replyToNavigateToId: replyId,
            ),
          );
        }
      case UserActivityVerbEnum.FOLLOWED:
      case UserActivityVerbEnum.AUTO_ADDED_TO_FOLLOWING:
        final String? followerId = dataPayload['followerId'];
        if (followerId != null) {
          context.pushRoute(
            ProfilePageRoute(idOfUserToFetch: followerId),
          );
        }
      case UserActivityVerbEnum.ADDED_TO_IC:
      case UserActivityVerbEnum.AUTO_ADDED_TO_IC:
        final String? userIdWhoAdded = dataPayload['subjectId'];
        if (userIdWhoAdded != null) {
          context.pushRoute(
            ProfilePageRoute(idOfUserToFetch: userIdWhoAdded),
          );
        }
      case UserActivityVerbEnum.COMMENT_EMBARGO_LIFTED:
        break;
      case UserActivityVerbEnum.REC_FIRST_STRIKE:
      case UserActivityVerbEnum.REC_SECOND_STRIKE:
      case UserActivityVerbEnum.REC_FINAL_STRIKE:
        final String? reportId = dataPayload['reviewRequestId'];
        if (reportId != null) {
          context.pushRoute(
            StrikeInfoPageRoute(reportId: reportId),
          );
        }
      case UserActivityVerbEnum.IMPROVED_PROFILE_RING:
        break;
      case UserActivityVerbEnum.JOINED_CHALLENGE:
      case UserActivityVerbEnum.CHALLENGE_CREATED:
        final String? challengeId = dataPayload['challengeId'];
        if (challengeId != null) {
          final bool hasCompletedChallengeOnboarding =
              Common().currentUser(context).onboardingStats.challenges;
          context.router.pushAll(
            [
              SingleChallengePageRoute(challengeId: challengeId),
              if (!hasCompletedChallengeOnboarding)
                ChallengesOnboardingPageRoute(
                  isEntryPoint: false,
                  isChallengeEducation: true,
                  skipLoginFlow: true,
                ),
            ],
          );
        }
    }
  }

  TextStyle buttonTextStyle() => const TextStyle(
        fontSize: 15,
        color: Colors.white,
        fontWeight: FontWeight.w600,
      );

  ButtonStyle buttonStyle({
    double radius = 20.0,
    double hPadding = 25,
    double vPadding = 8,
    Color? color,
    isFilled = true,
  }) {
    color ??= WildrColors.primaryColor;
    return ButtonStyle(
      padding: MaterialStateProperty.all<EdgeInsets>(
        EdgeInsets.symmetric(vertical: 8, horizontal: hPadding),
      ),
      backgroundColor:
          isFilled ? MaterialStateProperty.all<Color>(color) : null,
      foregroundColor:
          isFilled ? MaterialStateProperty.all<Color>(color) : null,
      shape: MaterialStateProperty.all<RoundedRectangleBorder>(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: color),
        ),
      ),
    );
  }

  Widget clipIt({
    required Widget child,
    double radius = 20.0,
    bool performant = false,
  }) {
    if (performant) {
      return DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.all(Radius.circular(radius)),
        ),
        child: child,
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: child,
    );
  }

  //Horizontal bar
  Widget bottomSheetDragger() => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 10),
        child: Center(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[400],
              borderRadius: const BorderRadius.all(
                Radius.circular(30),
              ),
            ),
            height: 4,
            width: Get.width * 0.12,
          ),
        ),
      );

  Widget multiPostThing(
    Widget child, {
    double rightPadding = 5,
    double topPadding = 8.0,
  }) =>
      Stack(
        children: [
          child,
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: EdgeInsets.only(top: topPadding, right: rightPadding),
              child: const WildrIcon(
                WildrIcons.carousel_filled,
                size: 10,
                color: Colors.black,
              ),
            ),
          ),
        ],
      );

  Container divider({Color color = Colors.white60, double height = 1}) =>
      Container(height: height, color: color);

  Widget? parentChallengeOnPost(FeedGxC feedGxC, BuildContext? context) {
    final challenge = feedGxC.currentPost.parentChallenge;
    final bool isTextPost =
        feedGxC.currentPost.subPosts?[feedGxC.currentSubIndex].type == 1;
    final Color color =
        isTextPost ? WildrColors.textColor(context) : Colors.white;
    if (challenge == null) return null;
    return Center(
      child: RepaintBoundary(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: GestureDetector(
            onTap: () {
              context?.pushRoute(
                SingleChallengePageRoute(challengeId: challenge.id),
              );
            },
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
              child: IntrinsicWidth(
                child: Container(
                  constraints: BoxConstraints(maxWidth: Get.width * 0.6),
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: isTextPost
                        ? Border.all(color: WildrColors.textColorSoft())
                        : null,
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: isTextPost
                        ? null
                        : [
                            BoxShadow(
                              color: Colors.grey.withOpacity(0.2),
                              spreadRadius: 2,
                              blurRadius: 5,
                              offset: const Offset(0, 3),
                            ),
                          ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WildrIcon(
                        WildrIcons.challenge_filled,
                        size: 14,
                        color: color,
                      ),
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            challenge.name,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                            softWrap: true,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.2,
                              color: color,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> dotIndicatorAndParentChallenge(
    FeedGxC feedGxC, {
    BuildContext? context,
  }) {
    final List<Widget> list = [];
    if ((feedGxC.currentPost.subPosts?.length ?? 0) > 1) {
      list.add(
        SizedBox(
          height: 30,
          child: dotIndicator(
            shouldShow: true,
            count: feedGxC.currentPost.subPosts!.length,
            currentIndex: max(feedGxC.currentSubIndex, 0),
          )!,
        ),
      );
    }
    final Widget? parentChallenge = parentChallengeOnPost(feedGxC, context);
    if (parentChallenge != null) {
      list.add(
        SizedBox(
          height: 30,
          child: parentChallenge,
        ),
      );
    }
    if (list.isEmpty) {
      list
        ..add(const SizedBox(height: 30))
        ..add(const SizedBox(height: 30));
    } else if (list.length == 1) {
      list.add(const SizedBox(height: 30));
    }
    return list;
  }

  List<Widget> feedDotIndicatorOrPlaceholder(
    FeedGxC feedGxC, {
    BuildContext? context,
  }) {
    final List<Widget> list = [];
    if ((feedGxC.currentPost.subPosts?.length ?? 0) > 1) {
      list.add(
        SizedBox(
          height: 30,
          child: dotIndicator(
            shouldShow: true,
            count: feedGxC.currentPost.subPosts!.length,
            currentIndex: max(feedGxC.currentSubIndex, 0),
          )!,
        ),
      );
    }
    if (list.isEmpty) {
      list.add(const SizedBox(height: 30));
    }
    return list;
  }

  Widget feedDotIndicator(FeedGxC feedGxC) {
    final Widget indicator;
    if ((feedGxC.currentPost.subPosts?.length ?? 0) > 1) {
      indicator = dotIndicator(
        shouldShow: true,
        count: feedGxC.currentPost.subPosts!.length,
        currentIndex: max(feedGxC.currentSubIndex, 0),
      )!;
    } else {
      indicator = const SizedBox();
    }
    return indicator;
  }

  Widget? dotIndicator({
    required bool shouldShow,
    required int count,
    required int currentIndex,
  }) =>
      shouldShow
          ? Center(
              child: DotsIndicator(
                dotsCount: count,
                position: currentIndex,
                decorator: DotsDecorator(
                  color: Colors.grey[300]!, // Inactive color
                  activeColor: WildrColors.primaryColor,
                ),
              ),
            )
          : null;

  Widget postGradientWidget(SinglePostGxC postGxC) => IgnorePointer(
        child: Obx(
          () => Container(
            decoration: BoxDecoration(
              gradient: Common().feedGradient(postGxC),
            ),
          ),
        ),
      );

  Widget feedGradientWidget(FeedGxC feedGxC) => IgnorePointer(
        child: Obx(
          () => Container(
            decoration: BoxDecoration(
              gradient: Common().feedGradient(feedGxC),
            ),
          ),
        ),
      );

  LinearGradient postGradient({
    required Post post,
    required bool isCaptionExpanded,
    required int currentSubIndex,
  }) {
    List<Color> colors;
    final bool isTextPost = (post.subPosts?[currentSubIndex].type ?? -1) == 1;
    if (isTextPost) {
      if (isCaptionExpanded) {
        if (Get.isDarkMode) {
          colors = [
            Colors.black87,
            Colors.black87,
            Colors.black87,
            Colors.transparent,
          ];
        } else {
          colors = [
            const Color(0xE6FFFFFF),
            const Color(0xE6FFFFFF),
            const Color(0xE6FFFFFF),
          ];
        }
      } else {
        colors = [
          Colors.transparent,
          Colors.transparent,
        ];
      }
    } else {
      if (isCaptionExpanded) {
        colors = [
          WildrColors.black80,
          WildrColors.black05,
        ];
      } else {
        colors = [
          Colors.black54,
          Colors.black54,
          Colors.transparent,
          Colors.transparent,
        ];
      }
    }
    return LinearGradient(
      begin: Alignment.bottomCenter,
      end: Alignment.center,
      colors: colors,
    );
  }

  LinearGradient feedGradient(FeedGxC feedGxC) => postGradient(
        post: feedGxC.currentPost,
        isCaptionExpanded: feedGxC.isCaptionExpanded.value,
        currentSubIndex: feedGxC.currentSubIndex,
      );

  void delayIt(Function onThen, {int millisecond = 100}) {
    Future.delayed(Duration(milliseconds: millisecond))
        .then((value) => onThen());
  }

  Future<void> delayInPlace([int milliseconds = 1000]) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }

  TextStyle captionTextStyle({Color? color}) {
    color ??= WildrColors.textColor();
    return TextStyle(
      fontSize: 13.0.sp,
      fontWeight: FontWeight.w500,
      color: color,
      fontFamily: FontFamily.satoshi,
      // decoration: TextDecoration.underline,
    );
  }

  Widget textOr() => Container(
        margin: EdgeInsets.only(top: Get.height * 0.02),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 65,
              ),
              Expanded(
                child: Common().divider(),
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                'Or',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17..sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(
                width: 10,
              ),
              Expanded(
                child: Common().divider(),
              ),
              const SizedBox(
                width: 65,
              ),
            ],
          ),
        ),
      );

  Future<List<Uint8List>> generateThumbnailAndCompressImageToUint8List(
    String filePath, {
    int thumbnailQuality = 80,
    int minWidth = 1920,
    int minHeight = 1080,
    onlyThumbnail = false,
  }) async {
    // final Trace trace =
    //     FirebasePerformance.instance.newTrace('compressImageAndThumbnail');
    // await trace.start();
    final List<Uint8List> data = [];
    try {
      debugPrint("File's absolute path $filePath");
      final Uint8List imageRaw = await File(filePath).readAsBytes();
      final Uint8List thumbnailList =
          await FlutterImageCompress.compressWithList(
        imageRaw,
        minHeight: minHeight,
        minWidth: minWidth,
        quality: thumbnailQuality,
        format: CompressFormat.webp,
      );
      data.add(thumbnailList);
      if (onlyThumbnail) return data;
      final Uint8List imageList = await FlutterImageCompress.compressWithList(
        imageRaw,
        quality: 80,
        format: CompressFormat.webp,
      );
      data.add(imageList);
    } catch (exception, stack) {
      debugPrint('ERROR $exception');
      await FirebaseCrashlytics.instance.recordError(exception, stack);
    } finally {
      // await trace.stop();
    }
    return data;
  }

  Future<List<File>> generateThumbnailAndCompressImageToFiles(
    String filePath, {
    int thumbnailQuality = 80,
    int minWidth = 1920,
    int minHeight = 1080,
    onlyThumbnail = false,
  }) async {
    final List<Uint8List> data =
        await generateThumbnailAndCompressImageToUint8List(
      filePath,
      thumbnailQuality: thumbnailQuality,
      minWidth: minWidth,
      minHeight: minHeight,
      onlyThumbnail: onlyThumbnail,
    );
    final thumbPath = await Common().getCompressedThumbnailOutPath(filePath);
    final List<File> files = [];
    final File thumb = File(thumbPath);
    await thumb.writeAsBytes(data[0]);
    files.add(thumb);
    if (onlyThumbnail) return files;
    final outPath = await Common().getCompressedOutPath(filePath);
    final File compressedImage = File(outPath);
    await compressedImage.writeAsBytes(data[1]);
    files.add(compressedImage);
    return files;
  }

  Widget unverifiedUserBanner(WildrUser user, BuildContext context) {
    final status = user.wildrVerifiedVerificationStatus;
    return Container(
      width: Get.width,
      color: WildrColors.unverifiedBannerColor(context),
      child: ListTile(
        horizontalTitleGap: 10,
        contentPadding: const EdgeInsets.only(left: 10, right: 5),
        leading: const WildrIconPng(
          WildrIconsPng.wildrUnverified,
          size: 35,
        ),
        dense: true,
        title: AutoSizeText(
          status.toBannerTitleString(),
          style: TextStyle(
            color: WildrColors.appBarTextColor(context),
            fontWeight: FontWeight.w600,
          ),
          maxLines: 1,
          minFontSize: 5,
        ),
        subtitle: AutoSizeText(
          status.toBannerSubTitle(),
          style: TextStyle(
            color: WildrColors.appBarTextColor(context),
          ),
          minFontSize: 5,
          maxLines: 1,
        ),
        trailing: TextButton(
          onPressed: () {
            context.pushRoute(
              const WildrVerifyIntroPageRoute(),
            );
          },
          child: Text(
            status == WildrVerifiedStatus.REVIEW_REJECTED
                ? AppLocalizations.of(context)!.comm_tryAgain
                : AppLocalizations.of(context)!.comm_getStarted,
            style: const TextStyle(
              color: WildrColors.emerald800,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Future<XFile?> fixRotation(String imagePath) async {
    final originalFile = File(imagePath);
    final originalImage = await pkg_img.decodeImageFile(imagePath);
    if (originalImage == null) return null;
    return XFile(
      (await originalFile.writeAsBytes(
        pkg_img.encodeJpg(pkg_img.flipHorizontal(originalImage)),
      ))
          .path,
    );
  }

  String toCompactCount(int count) => count == 0
      ? '0'
      : NumberFormat.compactCurrency(
          decimalDigits: 0,
          symbol: '',
        ).format(count);

  Widget get textIcon => Common().clipIt(
        child: Container(
          color: WildrColors.primaryColor,
          width: 45,
          height: 45,
          child: const WildrIcon(
            WildrIcons.text_fields_filled,
            color: Colors.white,
          ),
        ),
        radius: 4,
      );

  Widget get nullPostView => Container(
        width: 45,
        height: 45,
        color: Colors.orange,
        child: const Text('-'),
      );

  Widget _postWithThumbnail(Post post) {
    final Widget child = Common().clipIt(
      child: PostOverlayWrapper(
        isDense: true,
        iconSize: 10,
        titleFontSize: 5,
        post: post,
        child: Common().imageView(
          post.thumbnail!,
          boxFit: BoxFit.cover,
        ),
      ),
      radius: 5,
    );
    if (post.type == 4) {
      return Common().multiPostThing(child);
    }
    return child;
  }

  Widget postListTileIcon(Post? post, [BuildContext? context]) {
    if (post == null) return nullPostView;
    if (post.thumbnail != null) return _postWithThumbnail(post);
    if (post.type != 4) return textIcon;
    if (post.subPosts == null) {
      debugPrint('‼️ Why is type == 4 but subPosts = 0?');
      return const SizedBox();
    }
    final SubPost firstSubPost = post.subPosts!.first;
    Widget child;
    if (firstSubPost.type == 1) {
      child = (firstSubPost.bodyText?.isNotEmpty ?? false)
          ? Container(
              padding: const EdgeInsets.all(3),
              color: WildrColors.textPostBGColor(context),
              child: Center(
                child: Text(
                  firstSubPost.bodyText!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 6),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : textIcon;
    } else {
      child = Common().imageView(
        firstSubPost.thumbnail ?? '',
        boxFit: BoxFit.cover,
      );
    }
    return SizedBox(
      width: 45,
      height: 50,
      child: clipIt(
        child: PostOverlayWrapper(
          isDense: true,
          iconSize: 10,
          titleFontSize: 5,
          post: post,
          child: child,
        ),
        radius: 4,
      ),
    );
  }

  void showForceUpdateDialog(BuildContext context) {
    context.pushRoute(const ForceUpdatePageRoute());
  }

  void showPhotosPermissionDeniedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => CustomDialogBox(
        logo: const AttentionLogo(),
        title: AppLocalizations.of(context)!.comm_permissionDenied,
        description: AppLocalizations.of(context)!
            .comm_enablePhotosPermissionFromSettings,
        leftButtonText: AppLocalizations.of(context)!.comm_cap_cancel,
        leftButtonColor: WildrColors.errorColor,
        leftButtonOnPressed: Navigator.of(context).pop,
        rightButtonText: AppLocalizations.of(context)!.comm_openSettings,
        rightButtonOnPressed: () {
          openAppSettings();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  String formatDuration(Duration duration) {
    String twoDigits(int n) {
      if (n >= 10) return '$n';
      return '0$n';
    }

    final String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    final String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));

    return '$twoDigitMinutes:$twoDigitSeconds';
  }

  EdgeInsets challengeHeadingPadding() => EdgeInsets.fromLTRB(
        Get.width * 0.03,
        Get.height * 0.01,
        Get.width * 0.03,
        0,
      );

  void openCreatePostPage({
    required BuildContext context,
    Challenge? challenge,
  }) {
    context.pushRoute(
      CreatePostPageV1Route(
        mainBloc: Common().mainBloc(context),
        defaultSelectedChallenge: challenge,
      ),
    );
    return;
  }

  String getReferrerParams(BuildContext context) {
    if (!isLoggedIn(context)) return '';
    final user = currentUser(context);
    return '&${FDLParams.referralHandle}='
        '${user.handle}'
        '&${FDLParams.referralId}=${user.id}';
  }
}

enum ReportObjectTypeEnum {
  POST,
  COMMENT,
  REPLY,
  USER,
  CHALLENGE,
}

extension ReportWhatEnumValue on ReportObjectTypeEnum {
  String value() => toString().split('.').last.toLowerCase();
}

enum ReportUserEnum {
  ONE,
  TWO,
  THREE,
}

extension ReportUserEnumValue on ReportUserEnum {
  String value() => toString().split('.').last;

  String displayStr() {
    switch (this) {
      case ReportUserEnum.ONE:
        return "It's posting content that shouldn't be on Wildr";
      case ReportUserEnum.TWO:
        return "It's pretending to be someone else";
      case ReportUserEnum.THREE:
        return 'It may be under the age of $kAppMinimumAge';
    }
  }
}

enum ReportTypeEnum {
  ONE,
  TWO,
  THREE,
  FOUR,
  FIVE,
}

extension ReportEnumValue on ReportTypeEnum {
  String value() => name;

  String displayStr(BuildContext context) {
    switch (this) {
      case ReportTypeEnum.ONE:
        return AppLocalizations.of(context)!.comm_cap_spam;
      case ReportTypeEnum.TWO:
        return AppLocalizations.of(context)!.comm_nudity;
      case ReportTypeEnum.THREE:
        return AppLocalizations.of(context)!.comm_racist;
      case ReportTypeEnum.FOUR:
        return AppLocalizations.of(context)!.comm_violence;
      case ReportTypeEnum.FIVE:
        return AppLocalizations.of(context)!.comm_bullying;
    }
  }
}

class LowerCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) =>
      TextEditingValue(
        text: newValue.text.toLowerCase(),
        selection: newValue.selection,
      );
}

class PageInfo {
  bool? hasPreviousPage;
  bool? hasNextPage;
  String? startCursor;
  String? endCursor;
  int? pageNumber;
  int? count;
  int? totalCount;

  PageInfo.fromJson(Map<String, dynamic> map) {
    hasPreviousPage = map['hasPreviousPage'];
    hasNextPage = map['hasNextPage'];
    startCursor = map['startCursor'];
    endCursor = map['endCursor'];
    pageNumber = map['pageNumber'];
    count = map['count'];
    totalCount = map['totalCount'];
  }

  void copyFromPagination(PageInfo info) {
    hasNextPage = info.hasNextPage;
    endCursor = info.endCursor;
    pageNumber = info.pageNumber;
  }
}

enum PassFailState { PASS, FAIL }
