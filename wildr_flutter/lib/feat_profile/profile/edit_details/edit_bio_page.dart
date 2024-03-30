import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/input_formatters/better_limiting_text_input_formatter.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';

class EditBioPage extends StatefulWidget {
  final String bio;

  const EditBioPage(this.bio, {super.key});

  @override
  State<EditBioPage> createState() => _EditBioPageState();
}

class _EditBioPageState extends State<EditBioPage> {
  bool isSaving = false;
  late TextEditingController bioEC = TextEditingController(text: widget.bio);
  late String _text;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _text = widget.bio;
    super.initState();
  }

  void _submit() {
    if (isSaving) {
      return;
    }
    if (bioEC.text.length > 200) {
      Common().showErrorSnackBar(
        _appLocalizations.profile_bio200CharLimit,
        context,
      );
      return;
    }
    Common().mainBloc(context).add(UpdateUserBioEvent(bioEC.text));
    isSaving = true;
    context.loaderOverlay.show();
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {});
  }

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_cap_bio,
        actions: [
          TextButton(
            onPressed: widget.bio == bioEC.text || isSaving ? null : _submit,
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

  TextField _textField() => TextField(
        autofocus: true,
        minLines: 10,
        maxLines: 20,
        keyboardAppearance: Theme.of(context).brightness,
        controller: bioEC,
        inputFormatters: [BetterLimitingTextInputFormatter(200)],
        onChanged: (value) => setState(() => _text = value),
        onSubmitted: (_) => _submit(),
        decoration: InputDecoration(
          counterText: '${_text.length}/200',
        ),
      );

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is UpdateBioState) {
            setState(() {
              isSaving = false;
            });

            context.loaderOverlay.hide();

            if (state.errorMessage == null) {
              Navigator.of(context).pop();
              Common().showConfirmationSnackBar(
                _appLocalizations.profile_bioUpdatedSuccessfully,
                context,
              );
            } else {
              Common().showErrorSnackBar(state.errorMessage!, context);
            }
          }
        },
        child: Padding(
          padding: const EdgeInsets.only(left: 18.0, right: 18.0, top: 18.0),
          child: _textField(),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _appBar(),
        body: _body(),
      );
}
