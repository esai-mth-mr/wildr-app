import 'package:flutter/material.dart';
import 'package:get/get.dart';

class WildrColors {
  static bool isLightMode([BuildContext? context]) {
    bool isLight;
    if (context != null) {
      isLight = Theme.of(context).brightness == Brightness.light;
    } else {
      isLight = Get.theme.brightness == Brightness.light;
    }
    return isLight;
  }

  static const MaterialColor primarySwatches =
      MaterialColor(0xFF6BB063, <int, Color>{
    50: Color.fromRGBO(80, 179, 89, .1),
    100: Color.fromRGBO(80, 179, 89, .2),
    200: Color.fromRGBO(80, 179, 89, .3),
    300: Color.fromRGBO(80, 179, 89, .4),
    400: Color.fromRGBO(80, 179, 89, .5),
    500: Color.fromRGBO(80, 179, 89, .6),
    600: Color.fromRGBO(80, 179, 89, .7),
    700: Color.fromRGBO(80, 179, 89, .8),
    800: Color.fromRGBO(80, 179, 89, .9),
  });

  static const Color primaryColor = Color(0xFF00B64C);
  static const Color secondaryColor = Color(0xFFEBFCE3);
  static const Color accentColor = Color(0xFF50B359);
  static const Color blue = Color(0xFF8EB6F9);
  static const Color sherpaBlue = Color(0xFF0DAED9);
  static const Color yellow = Color(0xFFFFB619);
  static const Color teal = Color(0xFF00AAA1);
  static const Color indigo = Color(0xFF7B41DA);
  static const Color red = Color(0xFFF34D34);
  static const Color challengesDraft = Color(0xFF242424);
  static const Color fadedPrimaryColor = Color(0xFFEBFCE4);
  static const Color errorColor = Color(0xFFF34D34);
  static const Color bgColorDark = Color(0xFF121212);
  static const Color bottomAppBarColorDark = Color(0xFF000000);
  static const Color bottomAppBarColorLight = Color(0xFFF4F4F4);
  static const Color snackBarErrorColor = Color(0xF2616161);
  static const Color offWhite = Color(0xFFF4F4F4);

  //static const Color bottomBarColor = Color(0xFFF4F4F4);

  static const Color someGreyColor = Color(0xFFFFB619);
  static const Color bottomLabelsGreyColor = Color(0xFF686868);
  static const Color participantTitle = Color(0xFFF8F8F9);
  static const Color unselectedColor = Color(0xFF414152);

  static Color textColor([BuildContext? context]) =>
      isLightMode(context) ? black : white;

  static Color textColorSoft([BuildContext? context]) =>
      isLightMode(context) ? const Color(0xff54545D) : Colors.white70;

  static Color textColorStrong([BuildContext? context]) =>
      isLightMode(context) ? Colors.black : Colors.white;

  static Color separatorColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.grey[400]! : Colors.white54;

  static Color bottomLabelsColor([BuildContext? context]) =>
      isLightMode(context) ? const Color(0xFF686868) : Colors.white70;

  static Color tabIndicatorColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.black87 : white;

  static Color participantBottomSheetBackColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.white : gray1200;

  static Color textFieldColor([BuildContext? context]) =>
      isLightMode(context) ? const Color(0xFF76767D) : const Color(0xFFF4F4F4);

  static Color textPostBGColor([BuildContext? context]) =>
      isLightMode(context) ? const Color(0xFFF4F4F4) : darkCardColor;

  static Color unverifiedBannerColor([BuildContext? context]) =>
      isLightMode(context) ? const Color(0xFFF4F4F4) : darkCardColor;

  static Color appBarColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.white : Colors.black;

  static Color appBarTextColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.black87 : Colors.white70;

  static Color lightDarkTextModeColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.black : Colors.white;

  static Color notificationIconColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.black87 : Colors.white70;

  static Color assignToChallengeBottomSheetColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.white : gray1100;

  static Color wildrVerifiedRulesBg([BuildContext? context]) =>
      isLightMode(context) ? gray100 : gray1100;

  static Color wildrVerifyBottomSheetTopDivider([BuildContext? context]) =>
      isLightMode(context) ? gray200 : gray800;

  static Color wildrVerifySubTextColor({BuildContext? context}) =>
      isLightMode(context) ? gray600 : gray500;

  static Color wildrVerifyIdentity({BuildContext? context}) =>
      isLightMode(context) ? emerald050 : emerald1500;

  static Color singleChallengeBGColor({BuildContext? context}) =>
      isLightMode(context) ? white : gray1200;

  static Color pinnedCommentBgColor({BuildContext? context}) =>
      isLightMode(context) ? gray700 : gray700;

  //createPost v2
  static Color createPostBGColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.white : gray1200;

  static Color createPostButtonTextColor([BuildContext? context]) =>
      isLightMode(context) ? Colors.black87 : Colors.white70;

  static Color bannerOrTileBgColor([BuildContext? context]) =>
      isLightMode(context)
          ? const Color(0xFFF4F4F4)
          : WildrColors.darkCardColor;

  static Color addPostColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray100 : WildrColors.gray1100;

  static Color blankPostAddColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray100 : WildrColors.gray1100;

  static Color bottomSheetCardBGColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray200 : WildrColors.gray1000;

  static Color addBtnColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray500 : WildrColors.gray800;

  static Color uploadTabPermission([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray100 : WildrColors.gray1100;

  static Color nextDisableColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.emerald200 : WildrColors.emerald1400;

  static Color createPostV2LabelsColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray1200 : WildrColors.gray500;

  static Color trollDetectionSubTitle([BuildContext? context]) =>
      isLightMode(context) ? gray600 : gray400;

  static Color waitlistDashboardInviteTextColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray600 : WildrColors.gray900;

  static Color waitlistDashboardInviteTitleColor([BuildContext? context]) =>
      isLightMode(context) ? WildrColors.gray900 : WildrColors.gray200;

  // V2 Colors
  static const Color darkCardColor = Color(0xFF151518);
  static const Color redWarning = Color(0xFFEA4338);
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color gray50 = Color(0xFFF4F4F4);
  static const Color gray100 = Color(0xFFEDEDF0);
  static const Color gray200 = Color(0xFFDCDDE4);
  static const Color gray300 = Color(0xFFD2D3D6);
  static const Color gray400 = Color(0xFFC0C1C4);
  static const Color gray500 = Color(0xFFA2A3A9);
  static const Color gray600 = Color(0xFF86878C);
  static const Color gray700 = Color(0xFF68696F);
  static const Color gray800 = Color(0xFF4F5053);
  static const Color gray900 = Color(0xFF343539);
  static const Color gray950 = Color(0xFF2E3036);
  static const Color gray1000 = Color(0xFF242429);
  static const Color gray1100 = Color(0xFF1A1A1E);
  static const Color gray1200 = Color(0xFF101111);

  static const Color emerald025 = Color(0xFFD9F2E5);
  static const Color emerald050 = Color(0xFFCCEEDC);
  static const Color emerald100 = Color(0xFFB3E5CA);
  static const Color emerald200 = Color(0xFF99DCB8);
  static const Color emerald300 = Color(0xFF80D4A7);
  static const Color emerald400 = Color(0xFF66CB95);
  static const Color emerald500 = Color(0xFF4DC283);
  static const Color emerald600 = Color(0xFF33B971);
  static const Color emerald700 = Color(0xFF1AB160);
  static const Color emerald800 = Color(0xFF00A84E);
  static const Color emerald900 = Color(0xFF009746);
  static const Color emerald1000 = Color(0xFF007637);
  static const Color emerald1100 = Color(0xFF00652F);
  static const Color emerald1200 = Color(0xFF005427);
  static const Color emerald1300 = Color(0xFF00431F);
  static const Color emerald1400 = Color(0xFF003217);
  static const Color emerald1500 = Color(0xFF002210);
  static const Color emerald1600 = Color(0xFF001108);

  static const Color springGreen100 = Color(0xFFE9FBF1);
  static const Color springGreen200 = Color(0xFFD3F7E3);
  static const Color springGreen300 = Color(0xFFBCF3D5);
  static const Color springGreen400 = Color(0xFFA6EFC7);
  static const Color springGreen500 = Color(0xFF90EBBA);
  static const Color springGreen600 = Color(0xFF7AE6AC);
  static const Color springGreen700 = Color(0xFF64E29E);
  static const Color springGreen800 = Color(0xFF4DDE90);
  static const Color springGreen900 = Color(0xFF37DA82);
  static const Color springGreen1000 = Color(0xFF21D674);
  static const Color springGreen1100 = Color(0xFF1EC168);
  static const Color springGreen1200 = Color(0xFF1AAB5D);
  static const Color springGreen1300 = Color(0xFF179651);
  static const Color springGreen1400 = Color(0xFF148046);
  static const Color springGreen1500 = Color(0xFF106B3A);
  static const Color springGreen1600 = Color(0xFF0D562E);
  static const Color springGreen1700 = Color(0xFF0A4023);
  static const Color springGreen1800 = Color(0xFF072B17);
  static const Color springGreen1900 = Color(0xFF03150C);

  static const Color mintGreen100 = Color(0xFFE7FCF7);
  static const Color mintGreen200 = Color(0xFFCFFAEF);
  static const Color mintGreen300 = Color(0xFFB7F7E7);
  static const Color mintGreen400 = Color(0xFF9FF4DF);
  static const Color mintGreen500 = Color(0xFF86F2D8);
  static const Color mintGreen600 = Color(0xFF6EEFD0);
  static const Color mintGreen700 = Color(0xFF56ECC8);
  static const Color mintGreen800 = Color(0xFF3EE9C0);
  static const Color mintGreen900 = Color(0xFF26E7B8);
  static const Color mintGreen1000 = Color(0xFF0EE4B0);
  static const Color mintGreen1100 = Color(0xFF0DCD9E);
  static const Color mintGreen1200 = Color(0xFF0BB68D);
  static const Color mintGreen1300 = Color(0xFF0AA07B);
  static const Color mintGreen1400 = Color(0xFF08896A);
  static const Color mintGreen1500 = Color(0xFF077258);
  static const Color mintGreen1600 = Color(0xFF065B46);
  static const Color mintGreen1700 = Color(0xFF044435);
  static const Color mintGreen1800 = Color(0xFF032E23);
  static const Color mintGreen1900 = Color(0xFF011712);

  static const Color sherpaBlue100 = Color(0xFFE7F7FB);
  static const Color sherpaBlue200 = Color(0xFFCFEFF7);
  static const Color sherpaBlue300 = Color(0xFFB6E7F4);
  static const Color sherpaBlue400 = Color(0xFF9EDFF0);
  static const Color sherpaBlue500 = Color(0xFF86D6EC);
  static const Color sherpaBlue600 = Color(0xFF6ECEE8);
  static const Color sherpaBlue700 = Color(0xFF56C6E4);
  static const Color sherpaBlue800 = Color(0xFF3DBEE1);
  static const Color sherpaBlue900 = Color(0xFF25B6DD);
  static const Color sherpaBlue1000 = Color(0xFF0DAED9);
  static const Color sherpaBlue1100 = Color(0xFF0C9DC3);
  static const Color sherpaBlue1200 = Color(0xFF0A8BAE);
  static const Color sherpaBlue1300 = Color(0xFF097A98);
  static const Color sherpaBlue1400 = Color(0xFF086882);
  static const Color sherpaBlue1500 = Color(0xFF07576D);
  static const Color sherpaBlue1600 = Color(0xFF054657);
  static const Color sherpaBlue1700 = Color(0xFF043441);
  static const Color sherpaBlue1800 = Color(0xFF03232B);
  static const Color sherpaBlue1900 = Color(0xFF011116);

  static const Color gold100 = Color(0xFFFFF8EB);
  static const Color gold200 = Color(0xFFFFF2D8);
  static const Color gold300 = Color(0xFFFFEBC4);
  static const Color gold400 = Color(0xFFFFE4B1);
  static const Color gold500 = Color(0xFFFFDE9D);
  static const Color gold600 = Color(0xFFFED789);
  static const Color gold700 = Color(0xFFFED076);
  static const Color gold800 = Color(0xFFFEC962);
  static const Color gold900 = Color(0xFFFEC34F);
  static const Color gold1000 = Color(0xFFFEBC3B);
  static const Color gold1100 = Color(0xFFE5A935);
  static const Color gold1200 = Color(0xFFCB962F);
  static const Color gold1300 = Color(0xFFB28429);
  static const Color gold1400 = Color(0xFF987123);
  static const Color gold1500 = Color(0xFF7F5E1D);
  static const Color gold1600 = Color(0xFF664B18);
  static const Color gold1700 = Color(0xFF4C3812);
  static const Color gold1800 = Color(0xFF33260C);
  static const Color gold1900 = Color(0xFF191306);

  static const Color orange100 = Color(0xFFFEEFEB);
  static const Color orange200 = Color(0xFFFDDED8);
  static const Color orange300 = Color(0xFFFBCEC4);
  static const Color orange400 = Color(0xFFFABEB1);
  static const Color orange500 = Color(0xFFF9AE9D);
  static const Color orange600 = Color(0xFFF89D89);
  static const Color orange700 = Color(0xFFF78D76);
  static const Color orange800 = Color(0xFFF57D62);
  static const Color orange900 = Color(0xFFF46C4F);
  static const Color orange1000 = Color(0xFFF35C3B);
  static const Color orange1100 = Color(0xFFDB5335);
  static const Color orange1200 = Color(0xFFC24A2F);
  static const Color orange1300 = Color(0xFFAA4029);
  static const Color orange1400 = Color(0xFF923723);
  static const Color orange1500 = Color(0xFF7A2E1D);
  static const Color orange1600 = Color(0xFF612518);
  static const Color orange1700 = Color(0xFF491C12);
  static const Color orange1800 = Color(0xFF31120C);
  static const Color orange1900 = Color(0xFF180906);

  static const Color red100 = Color(0xFFFEE9EE);
  static const Color red200 = Color(0xFFFCD3DD);
  static const Color red300 = Color(0xFFFBBECC);
  static const Color red400 = Color(0xFFF9A8BB);
  static const Color red500 = Color(0xFFF892AA);
  static const Color red600 = Color(0xFFF67C9A);
  static const Color red700 = Color(0xFFF56689);
  static const Color red800 = Color(0xFFF35178);
  static const Color red900 = Color(0xFFF23B67);
  static const Color red1000 = Color(0xFFF02556);
  static const Color red1100 = Color(0xFFD8214D);
  static const Color red1200 = Color(0xFFC01E45);
  static const Color red1300 = Color(0xFFA81A3C);
  static const Color red1400 = Color(0xFF901634);
  static const Color red1500 = Color(0xFF78132B);
  static const Color red1600 = Color(0xFF600F22);
  static const Color red1700 = Color(0xFF480B1A);
  static const Color red1800 = Color(0xFF300711);
  static const Color red1900 = Color(0xFF180409);

  static const Color indigo100 = Color(0xFFF2ECFB);
  static const Color indigo200 = Color(0xFFE5D9F8);
  static const Color indigo300 = Color(0xFFD7C6F4);
  static const Color indigo400 = Color(0xFFCAB3F0);
  static const Color indigo500 = Color(0xFFBDA0ED);
  static const Color indigo600 = Color(0xFFB08DE9);
  static const Color indigo700 = Color(0xFFA37AE5);
  static const Color indigo800 = Color(0xFF9567E1);
  static const Color indigo900 = Color(0xFF8854DE);
  static const Color indigo1000 = Color(0xFF7B41DA);
  static const Color indigo1100 = Color(0xFF6F3AC4);
  static const Color indigo1200 = Color(0xFF6234AE);
  static const Color indigo1300 = Color(0xFF562E99);
  static const Color indigo1400 = Color(0xFF4A2783);
  static const Color indigo1500 = Color(0xFF3E206D);
  static const Color indigo1600 = Color(0xFF311A57);
  static const Color indigo1700 = Color(0xFF251341);
  static const Color indigo1800 = Color(0xFF190D2C);
  static const Color indigo1900 = Color(0xFF0C0716);

  // Gradient colors
  static const Color black80 = Color(0xCC000000);
  static const Color black05 = Color(0x0D000000);
}
