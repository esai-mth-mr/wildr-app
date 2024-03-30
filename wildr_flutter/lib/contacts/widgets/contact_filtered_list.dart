import 'package:flutter/material.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';
import 'package:wildr_flutter/contacts/widgets/contact_list_tile.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';

class ContactFilteredList extends StatelessWidget {
  final List<ContactInfo> contacts;
  final UserListType userListType;

  const ContactFilteredList(
    this.contacts, {
    super.key,
    required this.userListType,
  });

  @override
  Widget build(BuildContext context) => ListView.builder(
      itemCount: contacts.length,
      itemBuilder: (context, index) => ContactListTile(
        contacts[index],
        userListType: userListType,
      ),
    );
}
