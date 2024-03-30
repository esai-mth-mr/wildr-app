import 'package:flutter/widgets.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/date_time_string_formatter.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_coin/waitlist/data/coin_award.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';


extension AwardTypeIconExt on AwardType {
  String get iconPath {
    switch (this) {
      case AwardType.inviteAccepted:
        return WildrIcons.trophy_filled;
    }
  }
}

extension AwardStatusExt on AwardStatus {
  String displayName(BuildContext context) {
    switch (this) {
      case AwardStatus.pending:
        return  AppLocalizations.of(context)!.wildrcoin_award_status_pending;
      case AwardStatus.completed:
        return  AppLocalizations.of(context)!.wildrcoin_award_status_completed;
      case AwardStatus.failed:
        return  AppLocalizations.of(context)!.wildrcoin_award_status_failed;
    }
  }

  Color get displayColor {
    switch (this) {
      case AwardStatus.pending:
        return WildrColors.gray600;
      case AwardStatus.completed:
        return WildrColors.emerald800;
      case AwardStatus.failed:
        return WildrColors.red800;
    }
  }
}

extension CoinAwardExt on CoinAward {
  String get dateReceivedAgo => getTimeAgo(fromDate: dateReceived);
}
