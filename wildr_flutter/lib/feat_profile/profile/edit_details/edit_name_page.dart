import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class EditNamePage extends StatefulWidget {
  final String name;

  const EditNamePage(this.name, {super.key});

  @override
  State<EditNamePage> createState() => _EditNamePageState();
}

class _EditNamePageState extends State<EditNamePage> {
  bool isSaving = false;
  late final TextEditingController _nameTextController =
      TextEditingController(text: widget.name);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Future<void> _submit() async {
    if (isSaving) {
      return;
    } else {
      Common()
          .mainBloc(context)
          .add(UpdateUserNameEvent(_nameTextController.text));
      context.loaderOverlay.show();
      FocusManager.instance.primaryFocus?.unfocus();
      setState(() {
        isSaving = true;
      });
    }
  }

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_cap_name,
        actions: [
          TextButton(
            onPressed: widget.name == _nameTextController.text || isSaving
                ? null
                : _submit,
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
        listener: (context, state) async {
          if (state is UpdateUserNameState) {
            setState(() {
              isSaving = false;
            });
            if (state.errorMessage == null) {
              await FirebaseAuth.instance.currentUser!
                  .updateDisplayName(_nameTextController.text);
              Navigator.of(context).pop();
              Common().showConfirmationSnackBar(
                _appLocalizations.profile_nameUpdatedSuccessfully,
                context,
              );
            } else {
              Common().showErrorSnackBar(state.errorMessage!, context);
            }
            context.loaderOverlay.hide();
          }
        },
        child: Padding(
          padding: const EdgeInsets.only(left: 18.0, right: 18.0, top: 18.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _appLocalizations.profile_cap_name,
                style: TextStyle(
                  color: WildrColors.textColorStrong(),
                  fontSize: 18,
                ),
              ),
              TextField(
                autofocus: true,
                decoration: const InputDecoration(counterText: ''),
                keyboardAppearance: Theme.of(context).brightness,
                autocorrect: false,
                textCapitalization: TextCapitalization.words,
                maxLength: 200,
                controller: _nameTextController,
                onChanged: (value) => setState(() {}),
                onSubmitted: (_) => _submit(),
              ),
            ],
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _appBar(),
        body: _body(),
      );
}
