import 'package:auto_route/auto_route.dart';
import 'package:blur/blur.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:wildr_flutter/animations/fade_in_animation.dart';
import 'package:wildr_flutter/animations/fade_out_animation.dart';
import 'package:wildr_flutter/animations/slide_animation.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DoubleTapToLikeWrapperWidget extends StatefulWidget {
  final Widget child;
  final bool shouldAddBlur;
  final bool disable;

  const DoubleTapToLikeWrapperWidget({
    super.key,
    required this.child,
    this.shouldAddBlur = false,
    this.disable = false,
  });

  @override
  State<DoubleTapToLikeWrapperWidget> createState() =>
      _DoubleTapToLikeWrapperWidgetState();
}

class _DoubleTapToLikeWrapperWidgetState
    extends State<DoubleTapToLikeWrapperWidget> {
  int _showLikeKey = 0;
  final double _iconSize = 75;
  Offset _likeOffset = const Offset(-75, -75);

  @override
  Widget build(BuildContext context) => Stack(
        children: [
          GestureDetector(
            onDoubleTap: () {}, //Don't delete
            onDoubleTapDown: (details) {
              if (widget.disable) return;
              if (!Common().isLoggedIn(context)) {
                Common().openLoginPage(context.router);
                Common().showSnackBar(
                  context,
                  AppLocalizations.of(context)!.post_loginSignUpToReact,
                  isDisplayingError: true,
                );
                return;
              }
              Common().mainBloc(context).add(TriggerLikeEvent());
              setState(() {
                _showLikeKey++;
                _likeOffset = details.localPosition;
              });
            },
            child: widget.child,
          ),
          SlideAnimation(
            key: ValueKey(_showLikeKey),
            startLocation: _likeOffset,
            endLocation: Offset(_likeOffset.dx, -_iconSize),
            child: FadeOutAnimation(
              key: ValueKey(_showLikeKey),
              child: WildrIcon(
                WildrIcons.heart_filled,
                color: WildrColors.red,
                size: _iconSize,
              ),
            ),
          ),
          if (widget.shouldAddBlur)
            FadeInAnimation(
              child: Blur(
                child: Container(
                  color:
                      Get.isDarkMode ? WildrColors.bottomAppBarColorDark : null,
                ),
              ),
            ),
          if (widget.shouldAddBlur)
            Center(
              child: FadeInAnimation(
                duration: const Duration(milliseconds: 300),
                child: Lottie.asset(
                  'assets/animations/loader.json',
                  height: 250,
                ),
              ),
            ),
        ],
      );
}
