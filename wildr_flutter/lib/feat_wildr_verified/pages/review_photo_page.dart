import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/controller/wildr_verify_gxc.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/multi_button_bottom_sheet.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ReviewPhotoPage extends StatefulWidget {
  final File imageFile;

  const ReviewPhotoPage({super.key, required this.imageFile});

  @override
  State<ReviewPhotoPage> createState() => _ReviewPhotoPageState();
}

class _ReviewPhotoPageState extends State<ReviewPhotoPage> {
  final WildrVerifyGxC _wildrVerifyGxC = Get.put(WildrVerifyGxC());
  late File imageFile;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    imageFile = widget.imageFile;
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0,
          title: Text(_appLocalizations.wildr_verify_reviewPhoto),
        ),
        body: Stack(
          children: [
            SizedBox(
              width: Get.width,
              child: const WildrIcon(
                WildrIcons.wildrVerifyBg,
                color: WildrColors.emerald800,
              ),
            ),
            SizedBox(
              width: Get.width,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _profileVerificationImage(),
                  const SizedBox(height: 10),
                  TitleText(title: _appLocalizations.wildr_verify_reviewPhoto),
                  const SizedBox(height: 4),
                  SubTitleText(
                    subTitle: _appLocalizations
                        .wildr_verify_secondaryProfileImageDescription,
                  ),
                ],
              ),
            ),
          ],
        ),
        bottomNavigationBar: _bottomNavBtns(context),
      );

  Widget _profileVerificationImage() => Container(
        width: 200,
        height: 200,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          image: DecorationImage(
            fit: BoxFit.contain,
            image: FileImage(imageFile),
          ),
        ),
      );

  Widget _bottomNavBtns(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedBtn(
                  onTap: () {
                    _wildrVerifyGxC.saveManualFile(imageFile);
                    context.pushRoute(
                      const WildrVerifyFaceVerificationPageRoute(),
                    );
                  },
                  btnTitle: _appLocalizations.comm_cap_next,
                ),
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _selectMedia,
              child: Text(
                _appLocalizations.wildr_verify_changePhoto,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: WildrColors.textColorStrong(context),
                ),
              ),
            ),
          ],
        ),
      );

  Future<void> _takePhoto() async {
    final File? file = await Common().pickProfileImageAndCrop(
      context,
      ImageSource.camera,
    );
    if (file != null) imageFile = file;
    if (mounted) setState(() {});
  }

  Future<void> _chooseFromLibrary() async {
    final File? file =
        await Common().pickProfileImageAndCrop(context, ImageSource.gallery);
    if (file != null) imageFile = file;
    if (mounted) setState(() {});
  }

  void _popActionSheet() {
    Navigator.pop(context);
  }

  void _selectMedia() {
    final takePhotoButton = MultiButtonBottomSheetData(
      leadingIcon: const WildrIcon(WildrIcons.camera_outline),
      text: _appLocalizations.profile_takePhoto,
      onPressed: () {
        Common()
            .mainBloc(context)
            .logCustomEvent(WildrVerifiedEvents.kTakePhotoCTA);
        _popActionSheet();
        _takePhoto();
      },
    );
    final chooseFromLibraryButton = MultiButtonBottomSheetData(
      leadingIcon: const WildrIcon(WildrIcons.photograph_outline),
      text: _appLocalizations.profile_chooseFromLibrary,
      onPressed: () {
        Common()
            .mainBloc(context)
            .logCustomEvent(WildrVerifiedEvents.kChoosePhotoCTA);
        _popActionSheet();
        _chooseFromLibrary();
      },
    );
    _showModalBottomSheet(
      builder: (context) => MultiButtonBottomSheet([
        takePhotoButton,
        chooseFromLibraryButton,
      ]),
    );
  }

  void _showModalBottomSheet({
    required WidgetBuilder builder,
    VoidCallback? whenComplete,
  }) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
      backgroundColor: Colors.transparent,
      builder: builder,
    ).whenComplete(() {
      if (whenComplete != null) whenComplete();
    });
  }
}
