import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class AnimatedShakeProfilePic extends StatefulWidget {
  const AnimatedShakeProfilePic({super.key, this.user});
  final WildrUser? user;

  @override
  State<AnimatedShakeProfilePic> createState() =>
      _AnimatedShakeProfilePicState();
}

class _AnimatedShakeProfilePicState extends State<AnimatedShakeProfilePic>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _offsetAnimation;

  @override
  void initState() {
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _offsetAnimation = Tween(begin: 0.0, end: 10.0)
        .chain(CurveTween(curve: Curves.elasticIn))
        .animate(_controller)
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _controller.reverse();
        }
      });
    super.initState();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Common().wrapItWithRing(
        score: widget.user?.score,
        currentStrikeCount: widget.user?.strikeData.currentStrikeCount ?? 0,
        child: AnimatedBuilder(
          animation: _offsetAnimation,
          builder: (buildContext, child) => GestureDetector(
            onHorizontalDragEnd: (details) {
              Common().showSnackBar(
                context,
                AppLocalizations.of(context)!.profile_userNotWildrVerified,
              );
              if (details.primaryVelocity! > 0) {
                _controller.forward(from: 0.0);
              } else if (details.primaryVelocity! < 0) {
                _controller.forward(from: 0.0);
              }
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24.0),
              padding: EdgeInsets.only(
                left: _offsetAnimation.value + 24.0,
                right: 24.0 - _offsetAnimation.value,
              ),
              child: Center(
                child: ProfilePageCommon()
                    .profileImageCircleAvatarWithWildrVerified(
                  widget.user?.avatarImage,
                  widget.user?.handle,
                ),
              ),
            ),
          ),
        ),
      );
}
