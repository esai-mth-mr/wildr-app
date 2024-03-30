import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class EditPronounPage extends StatefulWidget {
  const EditPronounPage(this.pronoun, {super.key});

  final String pronoun;

  @override
  State<EditPronounPage> createState() => _EditPronounPageState();
}

class _EditPronounPageState extends State<EditPronounPage> {
  bool isSaving = false;
  late TextEditingController pronounTextController;
  late Pronoun _currentPronoun;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    final PronounGen pro = toPronoun(widget.pronoun);
    debugPrint(pro.otherString);
    pronounTextController = TextEditingController(text: pro.otherString);
    if (pro.pronoun == Pronoun.OTHER) {
      pronounTextController.text = pro.otherString ?? '';
    }
    _currentPronoun = pro.pronoun;
    super.initState();
  }

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_cap_pronouns,
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
          if (state is UpdateUserPronounState) {
            setState(() {
              isSaving = false;
            });
            if (state.errorMessage == null) {
              Navigator.of(context).pop();
              Common().showConfirmationSnackBar(
                _appLocalizations.profile_updatedPronounSuccessfully,
                context,
              );
            } else {
              Common().showErrorSnackBar(state.errorMessage!, context);
            }
          }
        },
        child: ListView(
          physics: const BouncingScrollPhysics(),
          children: [
            Column(
              children: Pronoun.values
                  .map(
                    (e) => RadioListTile(
                      title: Text(e.toViewString()),
                      onChanged: (value) {
                        value == Pronoun.OTHER
                            ? _focusNode.requestFocus()
                            : _focusNode.unfocus();
                        setState(
                          () => _currentPronoun = value ?? Pronoun.NONE,
                        );
                      },
                      activeColor: WildrColors.primaryColor,
                      value: e,
                      groupValue: _currentPronoun,
                    ),
                  )
                  .toList(),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                maxLength: 20,
                decoration: InputDecoration(
                  hintText: _appLocalizations.profile_addYourPronoun,
                  hintStyle: const TextStyle(color: Colors.grey),
                ),
                focusNode: _focusNode,
                onChanged: (value) {
                  debugPrint(value);
                  if (value == '') {
                    setState(() => _currentPronoun = Pronoun.NONE);
                  } else {
                    setState(() => _currentPronoun = Pronoun.OTHER);
                  }
                },
                keyboardAppearance: Theme.of(context).brightness,
                autocorrect: false,
                controller: pronounTextController,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp('[A-Za-z/ ]')),
                  LowerCaseTextFormatter(),
                  LengthLimitingTextInputFormatter(20),
                ],
                onSubmitted: (string) {
                  _submit();
                },
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
    if (isSaving) {
      return;
    } else {
      if (pronounTextController.text.length > 20 &&
          _currentPronoun == Pronoun.OTHER) {
        Common().showErrorSnackBar(
          _appLocalizations.profile_pronounShouldBeLessThan20Char,
          context,
        );
        return;
      }
      Common().mainBloc(context).add(
            UpdateUserPronounEvent(
              _currentPronoun.getValue(pronounTextController.text),
            ),
          );
      setState(() {
        isSaving = true;
      });
    }
  }
}
