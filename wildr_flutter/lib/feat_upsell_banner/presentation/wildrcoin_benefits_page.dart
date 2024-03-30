import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrCoinBenefitsPage extends StatelessWidget {
  const WildrCoinBenefitsPage({super.key});

  @override
  Widget build(BuildContext context) => BlocConsumer<MainBloc, MainState>(
        bloc: Common().mainBloc(context),
        listener: _mainBlocListener,
        builder: (context, state) => Scaffold(
          extendBodyBehindAppBar: true,
          extendBody: true,
          appBar: _appBarWithCrossOnRight(context),
          body: SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.only(
                left: 16.0.w,
                right: 16.0.w,
                bottom: 5.0.w,
                top: kToolbarHeight + 20.0.w,
              ),
              child: Column(
                children: [
                  _coinIcon(context),
                  SizedBox(height: 5.0.h),
                  _titleText(context),
                  const Spacer(),
                  ..._upsellElements(context),
                  const Spacer(),
                  _ctaText(context),
                  _joinWaitlistCTA(context),
                  const _TermsAndConditionsText(),
                ],
              ),
            ),
          ),
        ),
      );

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is WildrCoinWaitlistSignedUpState) {
      if (state.signedUpSuccessfully) {
        context.replaceRoute(const WaitlistJoinedSuccessPageRoute());
      } else {
        Common().showErrorSnackBar(
          AppLocalizations.of(context)!.comm_errorOopsMessage,
          context,
        );
      }
    }
    if (state is WildrCoinWaitlistSignedUpErrorState) {
      Common().showErrorSnackBar(
        state.errorMessage,
        context,
      );
    }
  }

  AppBar _appBarWithCrossOnRight(BuildContext context) => AppBar(
        leading: const SizedBox(),
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        actions: [
          IconButton(
            splashRadius: 0.1,
            onPressed: context.popRoute,
            icon: WildrIcon(
              WildrIcons.closeIcon,
              size: 20.0.w,
              color: WildrColors.black,
            ),
          ),
        ],
      );

  Widget _coinIcon(BuildContext context) =>
      WildrIconPng(WildrIconsPng.wildrCoin, size: 70.0.w);

  Widget _titleText(BuildContext context) => Text(
        AppLocalizations.of(context)!.wildrcoin_benefits_title,
        textAlign: TextAlign.center,
    style: TextStyle(
          fontFamily: FontFamily.slussenExpanded,
          fontWeight: FontWeight.w700,
          color: WildrColors.black,
          fontSize: 20.0.sp,
        ),
      );

  List<Widget> _upsellElements(BuildContext context) => [
        _UpsellCTAListElementWidget(
          image: WildrIconsPng.upsell_heart,
          topText:
              AppLocalizations.of(context)!.wildrcoin_benefits_benefit_title_1,
          bottomText: AppLocalizations.of(context)!
              .wildrcoin_benefits_benefit_subtitle_1,
        ),
        _UpsellCTAListElementWidget(
          image: WildrIconsPng.upsell_confirm_image_fourth,
          topText:
              AppLocalizations.of(context)!.wildrcoin_benefits_benefit_title_2,
          bottomText: AppLocalizations.of(context)!
              .wildrcoin_benefits_benefit_subtitle_2,
        ),
        _UpsellCTAListElementWidget(
          image: WildrIconsPng.upsell_plus,
          topText:
              AppLocalizations.of(context)!.wildrcoin_benefits_benefit_title_3,
          bottomText: AppLocalizations.of(context)!
              .wildrcoin_benefits_benefit_subtitle_3,
        ),
      ];

  Widget _ctaText(BuildContext context) => Text(
        AppLocalizations.of(context)!
            .wildrcoin_benefits_join_waitlist_cta_headline,
        style: const TextStyle(
          fontFamily: FontFamily.satoshi,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: WildrColors.black,
        ),
      );

  Widget _joinWaitlistCTA(BuildContext context) => Padding(
        padding: EdgeInsets.symmetric(vertical: 10.0.h),
        child: PrimaryCta(
          text: AppLocalizations.of(context)!
              .wildrcoin_benefits_join_waitlist_cta,
          backgroundColor: WildrColors.black,
          filled: true,
          onPressed: () {
            Common().mainBloc(context).add(JoinWildrCoinWaitlist());
          },
        ),
      );
}

class _UpsellCTAListElementWidget extends StatelessWidget {
  final String topText;
  final String bottomText;
  final String image;

  const _UpsellCTAListElementWidget({
    required this.topText,
    required this.bottomText,
    required this.image,
  });

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
          color: WildrColors.gray50,
          borderRadius: BorderRadius.circular(10),
        ),
        padding: EdgeInsets.symmetric(vertical: 10.0.h),
        margin: EdgeInsets.only(bottom: 8.0.h),
        child: ListTile(
          leading: Image.asset(image),
          titleAlignment: ListTileTitleAlignment.center,
          title: Text(
            topText,
            style: TextStyle(
              fontFamily: FontFamily.satoshi,
              fontWeight: FontWeight.w700,
              color: WildrColors.gray1200,
              fontSize: 15.0.sp,
            ),
          ),
          subtitle: Text(
            bottomText,
            style: TextStyle(
              fontFamily: FontFamily.satoshi,
              fontWeight: FontWeight.w500,
              color: WildrColors.gray900,
              fontSize: 12.0.sp,
            ),
            maxLines: 2,
          ),
        ),
      );
}

class _TermsAndConditionsText extends StatelessWidget {
  const _TermsAndConditionsText();

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.pushRoute(const TermsOfServicePageRoute()),
        child: Column(
          children: [
            Text(
              AppLocalizations.of(context)!
                  .wildrcoin_benefits_terms_and_conds_1,
              style: TextStyle(
                fontFamily: FontFamily.satoshi,
                fontSize: 11.0.sp,
                fontWeight: FontWeight.w600,
                color: WildrColors.gray700,
              ),
            ),
            Text(
              AppLocalizations.of(context)!
                  .wildrcoin_benefits_terms_and_conds_2,
              style: TextStyle(
                fontFamily: FontFamily.satoshi,
                fontSize: 11.0.sp,
                fontWeight: FontWeight.w600,
                color: WildrColors.gray700,
                decoration: TextDecoration.underline,
              ),
            ),
          ],
        ),
      );
}
