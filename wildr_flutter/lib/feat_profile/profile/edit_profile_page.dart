import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:get/get.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/apple_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/firebase_auth_linker.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/google_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/status_and_error.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/list_visibility_widget.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/routes.gr.dart';

void print(dynamic message) {
  debugPrint('EditProfilePage: $message');
}

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => EditProfilePageState();
}

class EditProfilePageState extends State<EditProfilePage> {
  late CurrentUserProfileGxC profileGxC = Get.find(tag: CURRENT_USER_TAG);
  late bool isDarkMode = Theme.of(context).brightness == Brightness.dark;
  late WildrUser user = profileGxC.user;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  File? _updatedProfileImage;
  bool _isUploading = false;
  late User currentUser;

  GoogleFBAuthProvider? _googleFBAuthProvider;
  AppleFBAuthProvider? _appleFBAuthProvider;

  @override
  void initState() {
    if (FirebaseAuth.instance.currentUser == null) {
      Navigator.of(context).pop();
      return;
    } else {
      currentUser = FirebaseAuth.instance.currentUser!;
      print(currentUser.providerData);
      _reload();
    }
    super.initState();
  }

  Future<void> _reload() async {
    await FirebaseAuth.instance.currentUser!.reload();
    if (mounted) setState(() {});
  }

  Widget _row(
    String title,
    String? value,
    Function onTap, {
    bool obscureText = false,
  }) =>
      ListTile(
        onTap: () {
          onTap();
        },
        contentPadding: const EdgeInsets.only(left: 20, right: 20),
        dense: true,
        leading: SizedBox(
          width: Get.width * 0.3,
          child: Text(
            title,
            style: _textStyle,
          ),
        ),
        title: Column(
          //crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value == null
                  ? ''
                  : (obscureText ? value.replaceAll(RegExp(r'.'), '*') : value),
              style: _textStyle,
              overflow: TextOverflow.ellipsis,
            ),
            const Divider(thickness: 1.5),
          ],
        ),
      );

  Widget _nameRow() => _row(_appLocalizations.profile_cap_name, user.name, () {
        context.pushRoute(
          EditNamePageRoute(name: user.name ?? ''),
        );
      });

  Widget _handleRow() =>
      _row(_appLocalizations.profile_cap_handle, user.handle, () {
        context.pushRoute(
          EditHandlePageRoute(
            handle: user.handle,
          ),
        );
      });

  Widget _pronounRow() =>
      _row(_appLocalizations.profile_cap_pronouns, user.pronoun ?? '', () {
        context.pushRoute(
          EditPronounPageRoute(
            pronoun: user.pronoun ?? '',
          ),
        );
      });

  Widget _bioRow() =>
      _row(_appLocalizations.profile_cap_bio, user.bio ?? '', () {
        context.pushRoute(
          EditBioPageRoute(
            bio: user.bio ?? '',
          ),
        );
      });

  int getProviderIdIndex(providerId) =>
      FirebaseAuth.instance.currentUser!.providerData
          .indexWhere((i) => i.providerId == providerId);

  Widget profileProviderTile({
    required IconData icon,
    required String providerId,
    required String name,
    required VoidCallback unlink,
    required VoidCallback link,
    VoidCallback? emailEdit,
  }) {
    final providerData = FirebaseAuth.instance.currentUser!.providerData;
    final providerIdIndex = getProviderIdIndex(providerId);
    TextButton button;
    if (providerIdIndex == -1) {
      button = TextButton(
        onPressed: link,
        child: Text(_appLocalizations.profile_cap_link),
      );
    } else if (providerId == 'password') {
      button = TextButton(
        onPressed: emailEdit,
        child: Text(_appLocalizations.createPost_edit),
      );
    } else {
      button = TextButton(
        onPressed: unlink,
        child: Text(_appLocalizations.profile_cap_unlink),
      );
    }

    String text;
    if (providerIdIndex == -1) {
      text = 'Connect your ${name.toLowerCase()} account';
    } else if (providerData[providerIdIndex].providerId == 'phone') {
      text = providerData[providerIdIndex].phoneNumber.toString();
    } else {
      text = providerData[providerIdIndex].email.toString();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 10.0),
      child: ListTile(
        leading: Icon(icon),
        title: Text(text),
        trailing: button,
      ),
    );
  }

  void _unlinkAppleAuth() {
    if (!WildrAuth().isEmailVerified() &&
        WildrAuth().getAllProviderTypes().length > 1) {
      Common().showSnackBar(
        context,
        _appLocalizations.profile_emailVerificationOrUnlinkingPrompt,
      );
      return;
    }
    Common().showAreYouSureDialog(
      context,
      title: _appLocalizations.profile_cap_unlink,
      text: _appLocalizations.profile_appleAccount,
      onYesTap: () async {
        _appleFBAuthProvider ??= AppleFBAuthProvider();
        final StatusAndMessage link =
            await _appleFBAuthProvider!.unlink(LoginType.APPLE);

        if (link.isSuccessful && mounted) {
          Common().showSnackBar(context, link.message);
        } else {
          Common().showErrorSnackBar(link.message, context);
        }
        await _reloadCurrentUser();
      },
    );
  }

  Future<void> _linkAppleAuth() async {
    debugPrint('Link apple auth');
    _appleFBAuthProvider ??= AppleFBAuthProvider();
    context.loaderOverlay.show();
    final StatusAndMessage link =
        await _appleFBAuthProvider!.link(LoginType.APPLE, context);
    context.loaderOverlay.hide();
    if (link.isSuccessful && mounted) {
      Common().showSnackBar(context, link.message);
    } else {
      Common().showErrorSnackBar(link.message, context);
    }
    await _reloadCurrentUser();
  }

  Widget _appleTile() => profileProviderTile(
        icon: FontAwesomeIcons.apple,
        providerId: 'apple.com',
        name: 'Apple',
        unlink: _unlinkAppleAuth,
        link: _linkAppleAuth,
      );

  Future<void> _linkGoogleAuth() async {
    _googleFBAuthProvider ??= GoogleFBAuthProvider();
    context.loaderOverlay.show();
    final StatusAndMessage link =
        await _googleFBAuthProvider!.link(LoginType.GOOGLE, context);
    context.loaderOverlay.hide();
    if (link.isSuccessful && mounted) {
      Common().showSnackBar(context, link.message);
    } else {
      print('Link failed');
      await _disconnectGoogleSignIn();
      Common().showErrorSnackBar(link.message, context);
    }
    await _reloadCurrentUser();
  }

  void _unlinkGoogleAuth() {
    if (!WildrAuth().isEmailVerified() &&
        WildrAuth().getAllProviderTypes().length > 1) {
      Common().showSnackBar(
        context,
        _appLocalizations.profile_emailVerificationOrUnlinkingPrompt,
      );
      return;
    }
    Common().showAreYouSureDialog(
      context,
      title: _appLocalizations.profile_cap_unlink,
      text: _appLocalizations.profile_googleAccount,
      onYesTap: () async {
        _googleFBAuthProvider ??= GoogleFBAuthProvider();
        final StatusAndMessage link =
            await _googleFBAuthProvider!.unlink(LoginType.GOOGLE);
        if (link.isSuccessful && mounted) {
          Common().showSnackBar(context, link.message);
        } else {
          Common().showErrorSnackBar(link.message, context);
        }
        await _disconnectGoogleSignIn();
        await _reloadCurrentUser();
      },
    );
  }

  Future<void> _disconnectGoogleSignIn() async {
    await WildrAuth().disconnectWithGoogleCredentialsIfAny();
  }

  Widget _googleTile() => profileProviderTile(
        icon: FontAwesomeIcons.google,
        providerId: 'google.com',
        name: 'Google',
        unlink: _unlinkGoogleAuth,
        link: _linkGoogleAuth,
      );

  Future<void> _reloadCurrentUser() async {
    await FirebaseAuth.instance.currentUser!.reload();
    setState(() {});
  }

  Widget _emailTile() => profileProviderTile(
        icon: FontAwesomeIcons.envelope,
        providerId: 'password',
        name: 'email',
        link: () {
          context
              .pushRoute(const LinkEmailPageRoute())
              .then((didSendVerificationEmail) async {
            if (didSendVerificationEmail == true) {
              Common().showSnackBar(context, 'Pls verify your email');
            }
            await _reloadCurrentUser();
          });
        },
        unlink: () {},
        emailEdit: _editEmail,
      );

  Future<void> _editEmail() async {
    final email = WildrAuth().getEmailAddressFromLoginType(LoginType.EMAIL);
    if (email == null) {
      Common().showSomethingWentWrong(context);
      return;
    }
    await context
        .pushRoute(EditEmailPageRoute(email: email))
        .then((_) => _reloadCurrentUser());
  }

  Column _allProviderColumn() => Column(
        children: [
          if (Platform.isIOS) _appleTile(),
          _googleTile(),
          _emailTile(),
          //_phoneNumberTile(),
        ],
      );

  InkWell _deleteAccountButton() => InkWell(
        onTap: () => context.pushRoute(const DeleteUserPageRoute()),
        child: Text(
          _appLocalizations.profile_deleteAccount,
          style:
              const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
        ),
      );

  Padding _listVisibilityRow() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: ListVisibilityWidget(
          user.visibilityPreferences?.list ??
              ListVisibility(
                follower: UserListVisibility.EVERYONE,
                following: UserListVisibility.EVERYONE,
              ),
        ),
      );

  bool _shouldShowLinking() =>
      !(WildrAuth().checkIfProviderExists(LoginType.PHONE) &&
          WildrAuth().getAllProviderTypes().length == 1);

  Widget _scaffoldBody() => SafeArea(
        child: Column(
          children: [
            _spacing(height: 20),
            _profileImage(),
            TextButton(
              onPressed: _changeProfilePhoto,
              child: _isUploading
                  ? const Center(child: CupertinoActivityIndicator())
                  : Text(
                      _appLocalizations.profile_changeProfilePhoto,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
            const Divider(),
            Expanded(
              flex: 50,
              child: ListView(
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        children: [
                          _handleRow(),
                          _nameRow(),
                          _pronounRow(),
                          _bioRow(),
                          const SizedBox(height: 20),
                          _listVisibilityRow(),
                          const SizedBox(height: 20),
                          if (_shouldShowLinking()) _allProviderColumn(),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            _deleteAccountButton(),
            const SizedBox(height: 10),
          ],
        ),
      );

  void _blocListener(BuildContext context, MainState state) {
    if (state is CurrentUserProfileRefreshState) {
      setState(() {
        _isUploading = false;
        user = state.user ?? profileGxC.user;
      });
    } else if (state is UpdateUserAvatarImageState) {
      debugPrint('here ${state.errorMessage}');
      _isUploading = false;
      if (state.errorMessage != null) {
        Common().showErrorDialog(
          context,
          title: 'Uh oh',
          description: state.errorMessage,
        );
      } else {
        if (_updatedProfileImage == null) {
          user.avatarImage?.url = null;
        } else {
          _updatedProfileImage = null;
        }
      }
      setState(() {});
    } else if (state is UpdateListVisibilityState) {
      context.loaderOverlay.hide();
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(kSomethingWentWrong, context);
      }
    }
  }

  Future<void> _cropAndAttachImage(String path) async {
    debugPrint('_cropAndAttachImage $path');
    final CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      cropStyle: CropStyle.circle,
      aspectRatioPresets: [
        CropAspectRatioPreset.square,
      ],
      // maxHeight: 96,
      // maxWidth: 96,
    );
    if (croppedFile == null) return;
    final List<File> files =
        await Common().generateThumbnailAndCompressImageToFiles(
      croppedFile.path,
      // minHeight: 300,
      // minWidth: 300,
      onlyThumbnail: true,
    );
    setState(() {
      _updatedProfileImage = files[0];
    });
  }

  Future<void> _chooseFromLibrary() async {
    Navigator.of(context).pop();
    final XFile? photo =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (photo == null) {
      debugPrint('Photo = null');
      return;
    }
    await _cropAndAttachImage(photo.path);
  }

  void _uploadImage() {
    if (_updatedProfileImage == null) {
      setState(() {});
      return;
    }
    Common()
        .mainBloc(context)
        .add(UpdateUserAvatarEvent(_updatedProfileImage!));
    setState(() {
      _isUploading = true;
    });
  }

  void _changeProfilePhoto() {
    Common().showActionSheet(context, [
      if (user.avatarImage?.url != null || _updatedProfileImage != null)
        TextButton(
          child: Text(
            _appLocalizations.profile_removeCurrentPhoto,
            style: Common().actionSheetTextStyle(
              color: Colors.red,
              context: context,
            ),
          ),
          onPressed: () {
            if (_updatedProfileImage == null) {
              Common().mainBloc(context).add(UpdateUserAvatarEvent(null));
              setState(() {
                _isUploading = true;
              });
            } else {
              _updatedProfileImage = null;
            }
            setState(() {});
            Navigator.of(context).pop();
          },
        ),
      if (user.avatarImage?.url != null || _updatedProfileImage != null)
        Common().actionSheetDivider(),
      TextButton(
        onPressed: () async {
          await context.pushRoute(
            UploadProfilePhotoPageRoute(
              onProfilePhotoSaved: (file) async {
                await _cropAndAttachImage(file.path);
              },
            ),
          );
        },
        child: Text(
          _appLocalizations.profile_takePhoto,
          style: Common().actionSheetTextStyle(context: context),
        ),
      ),
      Common().actionSheetDivider(),
      TextButton(
        onPressed: _chooseFromLibrary,
        child: Text(
          _appLocalizations.profile_chooseFromLibrary,
          style: Common().actionSheetTextStyle(context: context),
        ),
      ),
      //  Common().actionSheetDivider(),
    ]);
  }

  Widget _profileImage() => GestureDetector(
        onTap: _changeProfilePhoto,
        child: (_updatedProfileImage == null)
            ? Center(child: ProfilePageCommon().profileImageCircleAvatar(user))
            : Center(
                child: ProfilePageCommon()
                    .updatedProfileImage(_updatedProfileImage!.path),
              ),
      );

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_editProfile,
        actions: [
          if (_updatedProfileImage != null)
            TextButton(
              onPressed: () {
                _uploadImage();
              },
              child: Text(
                _appLocalizations.profile_cap_update,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
            ),
        ],
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _appBar(),
        body: BlocListener<MainBloc, MainState>(
          listener: _blocListener,
          child: _scaffoldBody(),
        ),
      );

  Widget _spacing({double height = 10}) => SizedBox(
        height: height,
      );

  final TextStyle _textStyle = const TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w500,
  );
}
