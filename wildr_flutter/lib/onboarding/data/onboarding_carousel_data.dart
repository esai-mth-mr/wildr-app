import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/buttons/two_big_buttons.dart';

enum OnboardingBodyType { LOTTIE, IMAGE, SVG, CHILD, EMPTY }

class OnboardingCarouselData {
  final String? lottieSrc;
  final String? imageSrc;
  final Widget? child;
  final String title;
  final String body;
  final OnboardingBodyType onboardingBodyType;
  final bool addBlur;
  final Widget? bigButton;
  final TwoBigButtons? twoBigButtons;
  final bool shouldShowPaginationDots;
  final Widget? childSubBody;
  final BoxFit? boxFit;
  bool showNextButton;
  final bool loop;

  OnboardingCarouselData.lottie({
    required this.lottieSrc,
    required this.title,
    required this.body,
    this.addBlur = false,
    this.bigButton,
    this.twoBigButtons,
    this.shouldShowPaginationDots = false,
    this.childSubBody,
    this.showNextButton = true,
    this.loop = true,
  })  : onboardingBodyType = OnboardingBodyType.LOTTIE,
        child = null,
        imageSrc = null,
        boxFit = null,
        assert(
          showNextButton && (!(bigButton != null && twoBigButtons != null)),
        ),
        assert(
          !(bigButton != null && twoBigButtons != null),
          'You cannot have both buttons types',
        );

  OnboardingCarouselData.image({
    required this.imageSrc,
    required this.title,
    required this.body,
    this.addBlur = false,
    this.bigButton,
    this.twoBigButtons,
    this.shouldShowPaginationDots = false,
    this.childSubBody,
    this.boxFit,
    this.showNextButton = true,
  })  : onboardingBodyType = OnboardingBodyType.IMAGE,
        child = null,
        lottieSrc = null,
        loop = false,
        assert(
          !(bigButton != null && twoBigButtons != null),
          'You cannot have both buttons types',
        );

  OnboardingCarouselData.svg({
    required this.imageSrc,
    required this.title,
    required this.body,
    this.addBlur = false,
    this.bigButton,
    this.twoBigButtons,
    this.shouldShowPaginationDots = false,
    this.childSubBody,
    this.boxFit,
    this.showNextButton = true,
  })  : onboardingBodyType = OnboardingBodyType.SVG,
        child = null,
        lottieSrc = null,
        loop = false,
        assert(
          !(bigButton != null && twoBigButtons != null),
          'You cannot have both buttons types',
        );

  OnboardingCarouselData.child({
    required this.child,
    required this.title,
    required this.body,
    this.addBlur = false,
    this.bigButton,
    this.twoBigButtons,
    this.shouldShowPaginationDots = false,
    this.childSubBody,
    this.showNextButton = true,
  })  : onboardingBodyType = OnboardingBodyType.CHILD,
        lottieSrc = null,
        imageSrc = null,
        boxFit = null,
        loop = false,
        assert(
          !(bigButton != null && twoBigButtons != null),
          'You cannot have both buttons types',
        );

  OnboardingCarouselData.empty()
      : onboardingBodyType = OnboardingBodyType.EMPTY,
        title = '',
        body = '',
        addBlur = false,
        child = null,
        boxFit = null,
        lottieSrc = null,
        bigButton = null,
        imageSrc = null,
        showNextButton = false,
        shouldShowPaginationDots = false,
        childSubBody = null,
        loop = false,
        twoBigButtons = null;

  @override
  String toString() => 'OnboardingCarouselData{lottieSrc: $lottieSrc, '
      'imageSrc: $imageSrc, child: $child, title: $title, body: $body,'
      ' onboardingBodyType: $onboardingBodyType, addBlur: $addBlur, '
      'bigButton: $bigButton, twoBigButtons: $twoBigButtons,'
      ' shouldShowPaginationDots: $shouldShowPaginationDots, '
      'childSubBody: $childSubBody}';
}
