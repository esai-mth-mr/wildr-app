import 'package:azlistview/azlistview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/actions/send_sms_actions.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';

void print(dynamic message) {
  debugPrint('ContactHandler: $message');
}

class ContactHandler {
  const ContactHandler();

  Future<List<Contact>> getAllContacts({bool withPhoto = false}) async {
    final contacts = await FlutterContacts.getContacts(
      withProperties: true,
      withPhoto: withPhoto,
    );
    return contacts;
  }

  Future<List<ContactInfo>> parseContacts(List<Contact> contacts) async {
    final List<ContactInfo> contactInfo = contacts
        .where((e) => e.phones.isNotEmpty)
        .map(
          (e) => ContactInfo.fromJson({
            'name': e.displayName,
            'phone': e.phones.first.number,
            'id': e.id,
          }),
        )
        .toList();
    SuspensionUtil.sortListBySuspensionTag(contactInfo);
    SuspensionUtil.setShowSuspensionStatus(contactInfo);
    return contactInfo;
  }

  Future<void> listeners(BuildContext context, MainState state) async {
    if (state is GenerateInviteCodeResultState) {
      if (state.errorMessage != null) {
        context.loaderOverlay.hide();
        Common().showErrorSnackBar(state.errorMessage!, context);
        return;
      }
      if (state.inviteCode != null &&
          state.userListType != null &&
          state.phoneNumber != null) {
        final String link =
            await ProfilePageCommon().generateInviteShortDeepLink(
          context: context,
          code: state.inviteCode!.toString(),
          title: kInviteOnWildrMessage,
          hasAction: true,
        );
        context.loaderOverlay.hide();
        sendSms(state.userListType!, state.phoneNumber!, link);
      } else {
        context.loaderOverlay.hide();
        Common().showErrorSnackBar(kSomethingWentWrong, context);
      }
    }
  }

  void sendSms(UserListType userListType, String phoneNumber, String link) {
    try {
      SendSmsActions().sendSmsToRecipient(
        phoneNumber,
        userListType.getSendSmsString(link),
      );
    } catch (e) {
      debugPrint(e.toString());
      Common().showErrorSnackBar(kSomethingWentWrong);
    }
  }
}
