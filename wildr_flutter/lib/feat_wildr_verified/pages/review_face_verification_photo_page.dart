import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/controller/wildr_verify_gxc.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ReviewFaceVerificationPhotoPage extends StatelessWidget {
  final File imageFile;

  ReviewFaceVerificationPhotoPage({super.key, required this.imageFile});
  final WildrVerifyGxC _wildrVerifyGxC = Get.put(WildrVerifyGxC());

  Widget _bgImage() => SizedBox(
        width: Get.width,
        child: const WildrIcon(
          WildrIcons.wildrVerifyBg,
          color: WildrColors.emerald800,
        ),
      );

  Widget _subtitle(BuildContext context) => SubTitleText(
        subTitle: AppLocalizations.of(context)!
            .wildr_verify_poseVerificationInstructions,
      );

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is WildrVerifyState) {
            context.loaderOverlay.hide();
            if (state.errorMessage != null) {
              print('Error message ${state.errorMessage}');
              Common().showErrorSnackBar(state.errorMessage!, context);
            } else {
              context.pushRoute(const WildrVerifiedPageRoute());
            }
          }
        },
        child: Scaffold(
          appBar: AppBar(
            elevation: 0,
            title: Text(AppLocalizations.of(context)!.wildr_verify_reviewPhoto),
          ),
          body: SafeArea(
            child: Padding(
              padding: EdgeInsets.only(top: Get.height * 0.02),
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  _bgImage(),
                  Column(
                    children: [
                      SizedBox(height: Get.height * 0.05),
                      Expanded(child: _faceVerificationImage()),
                      const SizedBox(height: 30),
                      TitleText(
                        title: AppLocalizations.of(context)!
                            .wildr_verify_reviewPhoto,
                      ),
                      const SizedBox(height: 4),
                      _subtitle(context),
                      SizedBox(height: Get.height * 0.05),
                      ..._actionButtons(context),
                      SizedBox(height: 35.0.h),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );

  Widget _faceVerificationImage() =>
      Common().clipIt(child: Image.file(imageFile));

  List<Widget> _actionButtons(BuildContext context) => [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedBtn(
              onTap: () {
                _sendResult(context);
              },
              btnTitle: AppLocalizations.of(context)!.wildr_verify_sendResults,
              btnTitleTextStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: WildrColors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: () {
            Navigator.pop(context);
          },
          child: Text(
            AppLocalizations.of(context)!.wildr_verify_retakePhoto,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: WildrColors.textColorStrong(context),
            ),
          ),
        ),
      ];

  Future<void> _sendResult(BuildContext context) async {
    context.loaderOverlay.show();
    try {
      final bool isImageFileExist = await imageFile.exists();
      if (imageFile.path.isEmpty && !isImageFileExist) {
        Common().showSnackBar(
          context,
          AppLocalizations.of(context)!.wildr_verify_resultSendingErrorMessage,
        );
        await context.popRoute();
        return;
      }
      _wildrVerifyGxC.saveFaceFile(imageFile);
      final faceFile = await Common().generateThumbnailAndCompressImageToFiles(
        imageFile.path,
        onlyThumbnail: true,
      );
      final manualFile =
          await Common().generateThumbnailAndCompressImageToFiles(
        _wildrVerifyGxC.getManualFile?.path ?? '',
        onlyThumbnail: true,
      );
      Common().mainBloc(context).add(
            WildrVerifyEvent(
              faceImageFile: faceFile[0],
              manualReviewFile: manualFile[0],
            ),
          );
    } catch (e) {
      context.loaderOverlay.hide();
      Common().showSomethingWentWrong(context);
    }
  }
}
