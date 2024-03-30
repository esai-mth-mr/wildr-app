import 'package:flutter/material.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/input_decorations.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

enum AppThemeEnum { DarkTheme, LightTheme }

class AppThemesData {
  static final themeData = {
    AppThemeEnum.LightTheme: ThemeData(
      brightness: Brightness.light,
      primaryColor: WildrColors.primaryColor,
      primaryColorLight: WildrColors.primaryColor,
      primaryColorDark: WildrColors.primaryColor,
      scaffoldBackgroundColor: Colors.white,
      bottomAppBarTheme: const BottomAppBarTheme(
        color: WildrColors.bottomAppBarColorLight,
      ),
      unselectedWidgetColor: WildrColors.unselectedColor,
      appBarTheme: const AppBarTheme(
        color: Colors.white,
        elevation: 0,
      ),
      textTheme: const TextTheme(
        titleLarge: TextStyle(color: Color.fromRGBO(41, 41, 52, 1)),
      ),
      fontFamily: FontFamily.satoshi,
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: InputDecorations.labelStyleBright,
        hintStyle: InputDecorations.hintStyleBright,
        isDense: true,
      ),
      indicatorColor: WildrColors.primaryColor,
      tabBarTheme: const TabBarTheme(
        labelColor: Colors.black,
        unselectedLabelColor: Colors.black54,
      ),
      colorScheme: ColorScheme.fromSwatch(
        backgroundColor: Colors.white,
        primarySwatch: WildrColors.primarySwatches,
        accentColor: WildrColors.accentColor,
      )
          .copyWith(
            secondary: WildrColors.accentColor,
            primary: WildrColors.primaryColor,
          )
          .copyWith(background: Colors.white),
    ),
    AppThemeEnum.DarkTheme: ThemeData(
      brightness: Brightness.dark,
      appBarTheme: const AppBarTheme(
        color: WildrColors.bgColorDark,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      primaryColor: WildrColors.primaryColor,
      primaryColorLight: WildrColors.primaryColor,
      primaryColorDark: WildrColors.primaryColor,
      scaffoldBackgroundColor: WildrColors.bgColorDark,
      unselectedWidgetColor: WildrColors.unselectedColor,
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: InputDecorations.labelStyleDark,
        hintStyle: InputDecorations.hintStyleDark,
        errorStyle: const TextStyle(color: Colors.redAccent),
        isDense: true,
      ),
      fontFamily: FontFamily.satoshi,
      indicatorColor: WildrColors.primaryColor,
      tabBarTheme: const TabBarTheme(
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white54,
      ),
      bottomAppBarTheme: const BottomAppBarTheme(
        color: WildrColors.bottomAppBarColorDark,
      ),
      colorScheme: ColorScheme.fromSwatch(
        brightness: Brightness.dark,
        primarySwatch: WildrColors.primarySwatches,
        accentColor: WildrColors.accentColor,
        backgroundColor: WildrColors.bgColorDark,
      )
          .copyWith(
            secondary: WildrColors.accentColor,
            background: WildrColors.bgColorDark,
            primary: WildrColors.primaryColor,
          )
          .copyWith(background: WildrColors.bgColorDark),
    ),
  };
}
