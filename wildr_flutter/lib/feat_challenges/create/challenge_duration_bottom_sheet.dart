import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:syncfusion_flutter_core/theme.dart';
import 'package:syncfusion_flutter_datepicker/datepicker.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/create_challenge_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeDurationBottomSheet extends StatefulWidget {
  final DateTime? startDate;
  final DateTime? endDate;
  final ValueSetter<List<DateTime>> onDurationSaved;

  const ChallengeDurationBottomSheet({
    super.key,
    this.startDate,
    this.endDate,
    required this.onDurationSaved,
  });

  @override
  State<ChallengeDurationBottomSheet> createState() =>
      _ChallengeDurationBottomSheetState();
}

class _ChallengeDurationBottomSheetState
    extends State<ChallengeDurationBottomSheet> {
  late DateTime? _startDate = widget.startDate;
  late DateTime? _endDate = widget.endDate;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final defaultTextStyle = DefaultTextStyle.of(context).style;
    DateTime maxDate = DateTime.now();
    maxDate = maxDate.add(const Duration(days: 365));
    return CreateChallengeBottomSheet(
      title: _appLocalizations.challenge_dateSetting,
      subtitle: _appLocalizations.challenge_dateRangeSelection,
      heightFactor: 0.7,
      onSave: () => widget.onDurationSaved([_startDate!, _endDate!]),
      canSave: _startDate != null && _endDate != null,
      hasEdited: _startDate != null || _endDate != null,
      child: SfDateRangePickerTheme(
        data: SfDateRangePickerThemeData(
          cellTextStyle: defaultTextStyle,
          disabledDatesTextStyle: defaultTextStyle.copyWith(
            color: WildrColors.gray500,
          ),
          activeDatesTextStyle: defaultTextStyle.copyWith(
            color: ChallengesStyles.of(context).primaryTextColor,
            fontWeight: FontWeight.w500,
          ),
          todayTextStyle: defaultTextStyle.copyWith(
            fontWeight: FontWeight.bold,
          ),
          selectionTextStyle: defaultTextStyle.copyWith(
            color: WildrColors.white,
            fontWeight: FontWeight.bold,
          ),
          rangeSelectionTextStyle: defaultTextStyle.copyWith(
            color: WildrColors.white,
            fontWeight: FontWeight.bold,
          ),
          rangeSelectionColor: WildrColors.emerald800,
          startRangeSelectionColor: WildrColors.emerald800,
          endRangeSelectionColor: WildrColors.emerald800,
        ),
        child: SfDateRangePicker(
          initialDisplayDate: _startDate,
          initialSelectedRange: PickerDateRange(_startDate, _endDate),
          selectionMode: DateRangePickerSelectionMode.range,
          enablePastDates: false,
          maxDate: maxDate,
          headerStyle: DateRangePickerHeaderStyle(
            textAlign: TextAlign.center,
            textStyle: defaultTextStyle.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          monthViewSettings: const DateRangePickerMonthViewSettings(
            dayFormat: 'EEE',
          ),
          selectionShape: DateRangePickerSelectionShape.rectangle,
          todayHighlightColor: Colors.transparent,
          onSelectionChanged: (args) {
            if (args.value is PickerDateRange) {
              setState(() {
                _startDate = args.value.startDate;
                _endDate = args.value.endDate;
                _endDate = _endDate
                    ?.add(const Duration(hours: 23, minutes: 59, seconds: 59));
              });
            }
          },
        ),
      ),
    );
  }
}
