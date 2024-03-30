import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_email_sender/flutter_email_sender.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_notifications/model/review_report_request.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/buttons/big_button.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class StrikeInfoPage extends StatefulWidget {
  final String reportId;

  const StrikeInfoPage(this.reportId, {super.key});

  @override
  State<StrikeInfoPage> createState() => _StrikeInfoPageState();
}

class _StrikeInfoPageState extends State<StrikeInfoPage> {
  ReviewReportRequest? report;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    context.loaderOverlay.show();
    Common().mainBloc(context).add(GetStrikeReportEvent(widget.reportId));
    super.initState();
  }

  String _emailBody() =>
      'Hey Wildr Team,\nI received a strike and believe that this was an error.'
      '\n\nReport #${report?.readableId ?? ""}\n*** '
      'Write in any extra information'
      ' you wish to add below ***\n\nThanks,'
      '\n@${Common().currentUser(context).handle}';

  Widget _getText() => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Text(
              _appLocalizations.home_strikeReasonNotification,
              textAlign: TextAlign.center,
            ),
            Text(
              report?.comment ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(color: WildrColors.primaryColor),
            ),
            const SizedBox(height: 10),
            Text(
              _appLocalizations.home_mistakenStrikeContactSupportMessage,
              textAlign: TextAlign.center,
            ),
            Text(
              report?.readableId ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(color: WildrColors.primaryColor),
            ),
          ],
        ),
      );

  Widget _getButtons() => Column(
        children: [
          BigButton.secondary(
            text: _appLocalizations.home_violatedCommunityGuideline,
            onPressed: () => context.pushRoute(
              CommunityGuidelinesPageRoute(reportLink: report?.link),
            ),
          ),
          const SizedBox(height: 10),
          PrimaryCta(
            text: _appLocalizations.home_cap_appeal,
            onPressed: () async {
              final Email email = Email(
                subject: 'REPORT #${report?.readableId ?? ""}'
                    ' Invalid Strike Request',
                body: _emailBody(),
                recipients: ['contact@wildr.com'],
              );
              context.loaderOverlay.show();
              try {
                await FlutterEmailSender.send(email);
                context.loaderOverlay.hide();
              } catch (e) {
                debugPrint('🔴 $e');
                context.loaderOverlay.hide();
                Common().showGetSnackBar(kSomethingWentWrong);
              }
            },
            filled: true,
          ),
        ],
      );

  void _listener(MainState state) {
    if (state is StrikeReportState) {
      context.loaderOverlay.hide();
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(state.errorMessage!, context);
      } else if (state.reviewReportRequest != null) {
        report = state.reviewReportRequest!;
        setState(() {});
      } else {
        Common().showErrorSnackBar(kSomethingWentWrong, context);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(_appLocalizations.home_strikeReceived)),
        body: BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            _listener(state);
          },
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(),
                _getText(),
                _getButtons(),
              ],
            ),
          ),
        ),
      );
}
