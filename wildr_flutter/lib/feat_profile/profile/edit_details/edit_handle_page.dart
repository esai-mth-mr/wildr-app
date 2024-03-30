import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class EditHandlePage extends StatefulWidget {
  const EditHandlePage(this.handle, {super.key});

  final String handle;

  @override
  State<EditHandlePage> createState() => _EditHandlePageState();
}

class _EditHandlePageState extends State<EditHandlePage> {
  bool isSaving = false;
  late TextEditingController handleEC =
      TextEditingController(text: widget.handle);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_cap_handle,
        actions: [
          TextButton(
            onPressed: isSaving ? null : _submit,
            child: Text(
              isSaving
                  ? _appLocalizations.profile_cap_updating
                  : _appLocalizations.profile_cap_update,
              style: TextStyle(
                fontWeight: isSaving ? null : FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ),
        ],
      );

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is UpdateUserHandleState) {
            setState(() {
              isSaving = false;
            });
            if (state.errorMessage == null) {
              Navigator.of(context).pop();
              Common().showConfirmationSnackBar(
                _appLocalizations.profile_handleUpdatedSuccessfully,
                context,
              );
            } else {
              Common().showErrorSnackBar(state.errorMessage!, context);
            }
          }
        },
        child: Stack(
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 18.0, right: 18.0, top: 18.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _appLocalizations.profile_cap_handle,
                    style: TextStyle(
                      color: WildrColors.textColorStrong(),
                      fontSize: 18,
                    ),
                  ),
                  TextField(
                    autofocus: true,
                    keyboardAppearance: Theme.of(context).brightness,
                    autocorrect: false,
                    controller: handleEC,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp('[A-Za-z0-9_]')),
                      LowerCaseTextFormatter(),
                      LengthLimitingTextInputFormatter(20),
                    ],
                    onSubmitted: (string) {
                      _submit();
                    },
                  ),
                  const SizedBox(
                    height: 30,
                  ),
                  Text(
                    '',
                    style: TextStyle(
                      color: WildrColors.textColor(),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            if (isSaving)
              Container(
                color: Colors.black12,
                width: Get.width,
                height: Get.height,
                child: const Center(
                  child: CupertinoActivityIndicator(
                    radius: 20,
                  ),
                ),
              ),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _appBar(),
        body: _body(),
      );

  void _submit() {
    if (handleEC.text.isEmpty) {
      Common()
          .showErrorSnackBar(_appLocalizations.profile_canNotUpdateEmptyHandle);
      return;
    }
    if (isSaving) {
      return;
    } else {
      if (handleEC.text.length < 5) {
        Common().showErrorSnackBar(
          _appLocalizations.profile_handleShouldBeMoreThan4Char,
        );
        return;
      }
      Common().mainBloc(context).add(UpdateUserHandleEvent(handleEC.text));
      setState(() {
        isSaving = true;
      });
    }
  }
}
