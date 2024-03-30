import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:helpers/helpers.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/cover_image_or_preset.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/create_challenge_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class ChallengeCoverPhotoBottomSheet extends StatefulWidget {
  final ValueSetter<ChallengeCoverPresetEnum> onPresetSaved;
  final ValueSetter<String> onCoverPhotoSaved;

  const ChallengeCoverPhotoBottomSheet({
    super.key,
    required this.onPresetSaved,
    required this.onCoverPhotoSaved,
  });

  @override
  State<ChallengeCoverPhotoBottomSheet> createState() =>
      _ChallengeCoverPhotoBottomSheetState();
}

class _ChallengeCoverPhotoBottomSheetState
    extends State<ChallengeCoverPhotoBottomSheet> {
  ChallengeCoverPresetEnum? _selectedPreset;
  String? _userSelectedImagePath;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  void _onPresetSelected(int index) {
    setState(() {
      _userSelectedImagePath = null;

      // Deselect if already selected.
      if (_selectedPreset == ChallengeCoverPresetEnum.values[index]) {
        _selectedPreset = null;
        return;
      }

      _selectedPreset = ChallengeCoverPresetEnum.values[index];
    });
  }

  Future<void> _onUploadButtonPressed() async {
    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }

    final ImagePicker picker = ImagePicker();
    final XFile? image;

    try {
      image =
          await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    } catch (e) {
      debugPrint(e.toString());
      return;
    }
    if (image == null) return;
    final CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: image.path,
      compressQuality: 80,
      aspectRatio: const CropAspectRatio(ratioX: 16, ratioY: 9),
    );
    if (croppedFile == null) return;
    setState(() {
      _userSelectedImagePath = croppedFile.path;
      _selectedPreset = null;
    });
  }

  void onSave() {
    if (_selectedPreset != null) {
      widget.onPresetSaved(_selectedPreset!);
    } else if (_userSelectedImagePath != null) {
      widget.onCoverPhotoSaved(_userSelectedImagePath!);
    }
  }

  @override
  Widget build(BuildContext context) => CreateChallengeBottomSheet(
        title: _appLocalizations.challenge_coverPhotoSpice,
        subtitle: _appLocalizations.challenge_boost,
        heightFactor: 0.9,
        canSave: _selectedPreset != null || _userSelectedImagePath != null,
        onSave: onSave,
        hasEdited: _selectedPreset != null || _userSelectedImagePath != null,
        action: PrimaryCta(
          onPressed: _onUploadButtonPressed,
          text: _appLocalizations.comm_cap_upload,
          fillWidth: true,
          outline: true,
        ),
        child: Column(
          children: [
            GestureDetector(
              onTap: _onUploadButtonPressed,
              child: CoverImageOrPreset(
                rounded: true,
                imageFilePath: _userSelectedImagePath,
                preset: _selectedPreset,
              ),
            ),
            const SizedBox(height: 16),
            _PresetCoverOptionsGrid(
              presets: ChallengeCoverPresetEnum.values,
              currentPresetIndex: _selectedPreset != null
                  ? ChallengeCoverPresetEnum.values.indexOf(_selectedPreset!)
                  : null,
              onPresetSelected: _onPresetSelected,
            ),
          ],
        ),
      );
}

class _PresetCoverOptionsGrid extends StatelessWidget {
  final List<ChallengeCoverPresetEnum> presets;
  final int? currentPresetIndex;
  final ValueSetter<int> onPresetSelected;

  const _PresetCoverOptionsGrid({
    required this.presets,
    this.currentPresetIndex,
    required this.onPresetSelected,
  });

  @override
  Widget build(BuildContext context) => GridView.count(
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        crossAxisCount: 4,
        childAspectRatio: 4 / 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: presets
            .mapIndexed(
              (index, preset) => GestureDetector(
                onTap: () => onPresetSelected(index),
                child: CoverImageOrPreset(
                  preset: preset,
                  bordered: currentPresetIndex == index,
                  rounded: true,
                ),
              ),
            )
            .toList(),
      );
}
