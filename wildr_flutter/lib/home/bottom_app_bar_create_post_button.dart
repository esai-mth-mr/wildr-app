import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class BottomAppBarCreatePostButton extends StatefulWidget {
  const BottomAppBarCreatePostButton({
    super.key,
  });

  @override
  State<BottomAppBarCreatePostButton> createState() =>
      _BottomAppBarCreatePostButtonState();
}

class _BottomAppBarCreatePostButtonState
    extends State<BottomAppBarCreatePostButton> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  void _onButtonLongPress() {
    Common().mainBloc(context).add(ToggleViewOnlyModeEvent(true));
  }

  void _onButtonTap() {
    if (Common().isLoggedIn(context)) {
      Common().openCreatePostPage(context: context);
      return;
    }
    Common().openLoginPage(context.router);
    Common().showSnackBar(
      context,
      _appLocalizations.home_loginSignupToCreatePostMessage,
      isDisplayingError: true,
      millis: 2000,
    );
    return;
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onLongPress: _onButtonLongPress,
        onTap: _onButtonTap,
        child: DecoratedBox(
          decoration:
              const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: WildrColors.appBarColor(context),
              border: Border.all(color: WildrColors.primaryColor),
            ),
            child: SizedBox(
              width: 36.0.wh,
              height: 36.0.wh,
              child: Align(
                child: WildrIcon(
                  WildrIcons.plus_filled,
                  color: WildrColors.primaryColor,
                  size: 16.0.wh,
                ),
              ),
            ),
          ),
        ),
      );
}
