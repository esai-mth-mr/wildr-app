import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';
import 'package:wildr_flutter/contacts/dialogs/contact_dialogs.dart';
import 'package:wildr_flutter/contacts/handler/contact_handler.dart';
import 'package:wildr_flutter/contacts/widgets/contact_filtered_list.dart';
import 'package:wildr_flutter/contacts/widgets/contact_list.dart';
import 'package:wildr_flutter/contacts/widgets/contact_search_bar.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/widgets/permission_message.dart';

class ContactsPage extends StatefulWidget {
  final UserListType userListType;

  const ContactsPage(this.userListType, {super.key});

  @override
  State<ContactsPage> createState() => _ContactsPageState();
}

class _ContactsPageState extends State<ContactsPage> {
  List<ContactInfo> _contacts = [];
  List<ContactInfo> _filteredContacts = [];
  late final TextEditingController _searchTextController;
  late bool shouldShowFiltered;
  bool? _hasPermissions;
  bool _didOpenAppSettings = false;

  @override
  void initState() {
    Common().mainBloc(context).logCustomEvent(AnalyticsEvents.kICContactsPage);
    _searchTextController = TextEditingController();
    shouldShowFiltered = _searchTextController.text.isNotEmpty;
    super.initState();
    if (Platform.isIOS) {
      _getContactIOS();
    } else {
      _checkPermissionsAndGetContacts();
    }
  }

  Future<void> _checkPermissionsAndGetContacts() async {
    context.loaderOverlay.show();
    final status = await Permission.contacts.status;
    _hasPermissions = status.isGranted;
    debugPrint('_hasPermissions = $_hasPermissions');
    context.loaderOverlay.hide();
    if (_hasPermissions = status.isGranted) {
      await _getContact();
    }
    setState(() {});
  }

  void _logPermissionsEvent(bool isSuccessful) {
    Common().mainBloc(context).logCustomEvent(
      AnalyticsEvents.kAddressBookPermission,
      {
        AnalyticsParameters.kStatus: isSuccessful
            ? AnalyticsParameters.kOk
            : AnalyticsParameters.kRejected,
      },
    );
  }

  Future<void> _getContactIOS() async {
    if (mounted) context.loaderOverlay.show();
    if (await FlutterContacts.requestPermission(readonly: true)) {
      _logPermissionsEvent(true);
      _hasPermissions = true;
      _contacts = await const ContactHandler()
          .parseContacts(await const ContactHandler().getAllContacts());
      context.loaderOverlay.hide();
      if (mounted) setState(() {});
    } else {
      _logPermissionsEvent(false);
      _showAllowAccessToContactsDialog();
    }
  }

  void _showAllowAccessToContactsDialog() {
    ContactDialogs(context)
        .showAllowAccessToContactsDialog()
        .then((dynamic value) async {
      if (Platform.isIOS) {
        if (!(await FlutterContacts.requestPermission(readonly: true))) {
          Navigator.pop(context);
        }
      }
      if (value == OPEN_APP_SETTINGS) {
        _openAppSettings();
      }
    });
  }

  void _openAppSettings() {
    openAppSettings().then((value) => _didOpenAppSettings = true);
  }

  Future<void> _getContact() async {
    if (mounted) context.loaderOverlay.show();
    final hasPermissions =
        await FlutterContacts.requestPermission(readonly: true);
    if (hasPermissions) {
      _logPermissionsEvent(true);
      _contacts = await const ContactHandler()
          .parseContacts(await const ContactHandler().getAllContacts());
      _hasPermissions = true;
      if (mounted) setState(() {});
      Common().delayIt(
        () => context.loaderOverlay.hide(),
        millisecond: 1000,
      );
    } else if (!_didOpenAppSettings) {
      _logPermissionsEvent(false);
      _showAllowAccessToContactsDialog();
      if (mounted) context.loaderOverlay.hide();
    } else {
      setState(() {
        _didOpenAppSettings = false;
      });
      if (mounted) context.loaderOverlay.hide();
    }
  }

  void _filterSearchResults(String query) {
    shouldShowFiltered = query.isNotEmpty;
    if (query.isNotEmpty) {
      _filteredContacts = _contacts
          .where(
            (r) => r.name.toLowerCase().contains(query.toLowerCase()),
          )
          .toList();
    }
    setState(() {});
  }

  Widget _noPermissionsPage() => PermissionMessageExplanation(
        wildrIcon: WildrIcons.contacts_outline,
        title: kICRequestForContactsTitle,
        message: kICRequestForContactsMessage,
        onAllowAccess: _getContact,
        onDenyAccess: () {
          Navigator.of(context).pop();
        },
      );

  Widget _body() {
    if (_hasPermissions == null) {
      return Container();
    }
    if (_hasPermissions == false) {
      return _noPermissionsPage();
    }
    return SafeArea(
      child: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: ContactSearchBar(
              _searchTextController,
              onChanged: _filterSearchResults,
            ),
          ),
          Expanded(
            child: !shouldShowFiltered
                ? ContactList(
                    _contacts,
                    userListType: widget.userListType,
                  )
                : ContactFilteredList(
                    _filteredContacts,
                    userListType: widget.userListType,
                  ),
          ),
        ],
      ),
    );
  }

  AppBar _appBar() => AppBar(
        title: Text(
          'Add to ${widget.userListType.toViewString()} from Contacts',
          style: const TextStyle(fontSize: 18),
        ),
        centerTitle: false,
      );

  @override
  Widget build(BuildContext context) => FGBGNotifier(
        onEvent: (type) {
          if (type == FGBGType.foreground) {
            if (_didOpenAppSettings) {
              _getContact();
            }
          }
        },
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          appBar: _appBar(),
          body: BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              const ContactHandler().listeners(context, state);
            },
            child: _body(),
          ),
        ),
      );
}
