import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AppUpdateTextStyles {
  static const TextStyle topTextStyle = TextStyle(
    fontFamily: 'SlussenExpanded',
    fontWeight: FontWeight.w600,
    color: WildrColors.black,
    fontSize: 16,
  );

  static const TextStyle satoshiFW600TextStyle = TextStyle(
    fontFamily: 'Satoshi',
    fontWeight: FontWeight.w600,
    fontSize: 18,
  );
  static const TextStyle satoshiFW600WhiteTextStyle = TextStyle(
    fontFamily: 'Satoshi',
    fontWeight: FontWeight.w600,
    color: WildrColors.white,
    fontSize: 18,
  );
  static const TextStyle satoshiFW500TextStyle = TextStyle(
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: WildrColors.gray600,
  );

  static const TextStyle satoshiFW700darkTextStyle = TextStyle(
    fontSize: 16,
    fontFamily: 'Satoshi',
    fontWeight: FontWeight.w700,
    color: WildrColors.black,
  );
  static const TextStyle satoshiFW700lightTextStyle = TextStyle(
    fontSize: 16,
    fontFamily: 'Satoshi',
    fontWeight: FontWeight.w700,
    color: WildrColors.white,
  );

  static const TextStyle satoshiFW500darkTextStyle = TextStyle(
    fontFamily: 'Satoshi',
    fontSize: 18,
    color: WildrColors.white,
  );

  static const TextStyle satoshiFW500lightTextStyle = TextStyle(
    fontFamily: 'Satoshi',
    fontSize: 18,
    color: WildrColors.bgColorDark,
  );

  static const TextStyle slussenFW600mintGreen700TextStyle = TextStyle(
    fontFamily: 'SlussenExpanded',
    height: 1.2,
    fontWeight: FontWeight.w600,
    fontSize: 26,
    color: WildrColors.mintGreen700,
  );

  static const TextStyle slussenFW600mintGreen1000TextStyle = TextStyle(
    fontFamily: 'SlussenExpanded',
    height: 1.2,
    fontWeight: FontWeight.w600,
    fontSize: 26,
    color: WildrColors.mintGreen1000,
  );
}
