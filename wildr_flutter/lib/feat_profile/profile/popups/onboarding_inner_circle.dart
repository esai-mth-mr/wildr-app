import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';
import 'package:wildr_flutter/onboarding/skeleton/single_page_onboarding_skeleton.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class OnboardingInnerCircle extends StatefulWidget {
  const OnboardingInnerCircle({super.key});

  @override
  State<OnboardingInnerCircle> createState() => _OnboardingInnerCircleState();
}

class _OnboardingInnerCircleState extends State<OnboardingInnerCircle> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  String get _bodyStr => 'A space just for you and those closest to you.'
      ' Add people to your Inner Circle and start '
      'sharing your most special moments.';

  Widget _primaryActionBtn() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: PrimaryCta(
          text: _appLocalizations.profile_createMyInnerCircle,
          onPressed: () {
            Navigator.pop(context);
            Common().mainBloc(context).add(NavigateToTabEvent(HomeTab.PROFILE));
            Common().delayIt(() {
              Common().mainBloc(context).add(RefreshCurrentUserPageEvent());
              Common()
                  .mainBloc(context)
                  .add(GoToUserListEvent(UserListType.INNER_CIRCLE));
            });
            Common()
                .mainBloc(context)
                .add(FinishOnboardingEvent(OnboardingType.INNER_CIRCLE));
          },
          filled: true,
        ),
      );

  Widget _backButton() => IconButton(
        icon: const WildrIcon(WildrIcons.x_filled),
        onPressed: () {
          Common().mainBloc(context).add(
                SkipOnboardingEvent(OnboardingType.INNER_CIRCLE),
              );
          Navigator.pop(context);
        },
      );

  Widget _body() => SinglePageOnboardingSkeleton(
        OnboardingCarouselData.lottie(
          lottieSrc: 'assets/onboarding/inner_circle.json',
          title: _appLocalizations.profile_introducingMyInnerCircle,
          body: _bodyStr,
          bigButton: _primaryActionBtn(),
        ),
        heightPercentage: .65,
        customAppbarLeadingButton: _backButton(),
      );

  @override
  Widget build(BuildContext context) => _body();
}
