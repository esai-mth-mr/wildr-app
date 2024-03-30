import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class AnimatedProfilePicFromUser extends StatelessWidget {
  final WildrUser user;
  const AnimatedProfilePicFromUser(this.user, {super.key});

  @override
  Widget build(BuildContext context) => AnimatedProfilePic(
      front: ProfilePageCommon().profileImageCircleAvatarWithWildrVerified(
        user.avatarImage,
        user.handle,
      ),
      rear: ProfilePageCommon().profileImageCircleAvatarWithWildrVerified(
        user.wildrVerifiedFace,
        user.handle,
      ),
      user: user,
    );
}

class AnimatedProfilePic extends StatefulWidget {
  final Widget front;
  final Widget rear;
  final WildrUser? user;
  final bool shouldWrapWithRing;
  final VoidCallback? onSwitchCard;

  const AnimatedProfilePic({
    required this.front,
    required this.rear,
    this.user,
    this.shouldWrapWithRing = true,
    this.onSwitchCard,
    super.key,
  });

  @override
  State<AnimatedProfilePic> createState() => _AnimatedProfilePicState();
}

class _AnimatedProfilePicState extends State<AnimatedProfilePic> {
  bool _showFrontSide = true;
  final bool _flipXAxis = true;
  bool _currentlyPlaying = false;

  @override
  void initState() {
    super.initState();
  }

  Widget _buildLayout({required Key key, required Widget child}) => Container(
      key: key,
      child: child,
    );

  Widget _buildFront() => _buildLayout(
      key: const ValueKey(true),
      child: widget.front,
    );

  Widget _buildRear() => _buildLayout(
      key: const ValueKey(false),
      child: widget.rear,
    );

  Widget _buildFlipAnimation() => GestureDetector(
      onHorizontalDragEnd: (details) {
        if (details.primaryVelocity! > 0) {
          _switchCard();
        } else if (details.primaryVelocity! < 0) {
          _switchCard();
        }
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 800),
        transitionBuilder: _transitionBuilder,
        layoutBuilder: (widget, list) => Stack(children: [widget!, ...list]),
        switchInCurve: Curves.easeInBack,
        switchOutCurve: Curves.easeInBack.flipped,
        child: _showFrontSide ? _buildFront() : _buildRear(),
      ),
    );

  void _switchCard() {
    setState(() {
      if (!_currentlyPlaying) {
        _currentlyPlaying = true;
        _showFrontSide = !_showFrontSide;
      }
      Future.delayed(const Duration(milliseconds: 800), () {
        _currentlyPlaying = false;
        if (widget.onSwitchCard != null) {
          widget.onSwitchCard!.call();
        }
      });
    });
  }

  Widget _transitionBuilder(Widget widget, Animation<double> animation) {
    final rotateAnim = Tween(begin: math.pi, end: 0.0).animate(animation);
    return AnimatedBuilder(
      animation: rotateAnim,
      child: widget,
      builder: (context, widget) {
        final isUnder = ValueKey(_showFrontSide) != widget?.key;
        var tilt = ((animation.value - 0.5).abs() - 0.5) * 0.003;
        tilt *= isUnder ? -1.0 : 1.0;
        final value = isUnder
            ? math.min(rotateAnim.value, math.pi / 2)
            : rotateAnim.value;
        return Transform(
          transform: _flipXAxis
              ? (Matrix4.rotationY(value)..setEntry(3, 0, tilt))
              : (Matrix4.rotationX(value)..setEntry(3, 1, tilt)),
          alignment: Alignment.center,
          child: widget,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.shouldWrapWithRing) {
      return Common().wrapItWithRing(
        child: _buildFlipAnimation(),
        score: widget.user?.score,
        currentStrikeCount: widget.user?.strikeData.currentStrikeCount ?? 0,
      );
    } else {
      return _buildFlipAnimation();
    }
  }
}
