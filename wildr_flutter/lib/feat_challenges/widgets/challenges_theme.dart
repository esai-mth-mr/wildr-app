import 'package:flutter/material.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesTheme extends StatelessWidget {
  final Widget child;

  const ChallengesTheme({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    final brightness = Theme.of(context).brightness;

    return Theme(
      data: ThemeData(
        brightness: brightness,
        fontFamily: FontFamily.satoshi,
        scaffoldBackgroundColor: styles.scaffoldBackgroundColor,
        appBarTheme: styles.appBarTheme,
        dividerTheme: styles.dividerThemeData,
        bottomSheetTheme: styles.bottomSheetThemeData,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(36, 36),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            backgroundColor: WildrColors.emerald800,
            foregroundColor: WildrColors.white,
            shadowColor: Colors.transparent,
            textStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontFamily: FontFamily.satoshi,
            ),
          ),
        ),
        inputDecorationTheme: styles.inputDecorationTheme,
        tabBarTheme: styles.tabBarTheme,
        chipTheme: styles.chipThemeData,
        textTheme: const TextTheme(
          // Use medium font weight for default body text.
          bodyMedium: TextStyle(
            fontWeight: FontWeight.w500,
          ),
        ),
        colorScheme: ColorScheme.fromSeed(
          brightness: brightness,
          seedColor: WildrColors.emerald800,
          background: styles.scaffoldBackgroundColor,
        ).copyWith(background: styles.scaffoldBackgroundColor),
      ),
      child: child,
    );
  }
}

class ChallengesStyles {
  final bool isDark;

  ChallengesStyles({
    required this.isDark,
  });

  Color get scaffoldBackgroundColor =>
      isDark ? WildrColors.black : WildrColors.white;

  Color get backgroundColor =>
      isDark ? WildrColors.gray1200 : WildrColors.white;

  Color get primaryTextColor => isDark ? WildrColors.white : WildrColors.black;

  Color get myChallengeCard =>
      isDark ? const Color(0xFF232323) : WildrColors.gray100;

  Color get dividerColor => isDark ? WildrColors.gray1000 : WildrColors.gray200;

  Color get mutedTextColor =>
      isDark ? WildrColors.gray500 : WildrColors.gray800;

  Color get leaderboardCreatorTileColor =>
      isDark ? WildrColors.gray1000 : WildrColors.gray100;

  Color get leaderboardParticipantTileColor =>
      isDark ? WildrColors.darkCardColor : const Color(0xFFFAFAFA);

  Color get bottomSheetActionsBackgroundColor =>
      isDark ? WildrColors.gray1100 : WildrColors.white;

  Color get entryCardBorderColor =>
      isDark ? WildrColors.gray900 : WildrColors.gray100;

  Color get createEntryCardBorderColor =>
      isDark ? WildrColors.white : WildrColors.gray100;

  TextStyle get headline1TextStyle => TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: primaryTextColor,
      );

  TextStyle get headline2TextStyle => TextStyle(
        fontSize: 18,
        height: 1.2,
        fontWeight: FontWeight.bold,
        color: primaryTextColor,
      );

  TextStyle get headline3TextStyle => TextStyle(
        fontSize: 16,
        height: 1.2,
        fontWeight: FontWeight.bold,
        color: primaryTextColor,
      );

  TextStyle get subtitleTextStyle => TextStyle(
        fontWeight: FontWeight.bold,
        color: mutedTextColor,
      );

  TextStyle get subtitle2TextStyle => TextStyle(
        color: mutedTextColor,
      );

  TextStyle get appBarTitleTextStyle => const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: WildrColors.gray300,
      );

  TextStyle get textFieldHeaderTextStyle => TextStyle(
        color: isDark ? WildrColors.gray300 : WildrColors.gray1100,
      );

  TextStyle get hintTextStyle => const TextStyle(
        color: WildrColors.gray700,
      );

  DividerThemeData get dividerThemeData => DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      );

  AppBarTheme get appBarTheme => AppBarTheme(
        elevation: 0,
        shape: Border(
          bottom: BorderSide(
            color: dividerColor,
          ),
        ),
        backgroundColor: backgroundColor,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: primaryTextColor,
          fontWeight: FontWeight.bold,
          fontSize: 16,
          fontFamily: FontFamily.satoshi,
        ),
        iconTheme: IconThemeData(
          color: primaryTextColor,
        ),
      );

  InputDecorationTheme get inputDecorationTheme => InputDecorationTheme(
        suffixIconColor: WildrColors.gray700,
        hintStyle: const TextStyle(
          color: WildrColors.gray700,
          fontWeight: FontWeight.w500,
          fontSize: 16,
        ),
        contentPadding: const EdgeInsets.symmetric(
          vertical: 12,
          horizontal: 16,
        ),
        border: OutlineInputBorder(
          borderSide: BorderSide(
            color: isDark ? WildrColors.gray900 : WildrColors.gray200,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(8)),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: isDark ? WildrColors.gray900 : WildrColors.gray200,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: isDark ? WildrColors.white : WildrColors.black,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(8)),
        ),
      );

  BottomSheetThemeData get bottomSheetThemeData => BottomSheetThemeData(
        backgroundColor: backgroundColor,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(12),
            topRight: Radius.circular(12),
          ),
        ),
      );

  ChipThemeData get chipThemeData => ChipThemeData(
        backgroundColor: backgroundColor,
        selectedColor: WildrColors.emerald800,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        labelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      );

  TabBarTheme get tabBarTheme => TabBarTheme(
        unselectedLabelColor:
            isDark ? WildrColors.gray500 : WildrColors.gray800,
        labelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontFamily: FontFamily.satoshi,
        ),
        labelColor: isDark ? WildrColors.white : WildrColors.black,
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontFamily: FontFamily.satoshi,
        ),
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          color: isDark ? WildrColors.gray1100 : WildrColors.gray100,
        ),
        overlayColor: MaterialStateProperty.all(Colors.transparent),
      );

  factory ChallengesStyles.of(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return ChallengesStyles(isDark: isDark);
  }
}
