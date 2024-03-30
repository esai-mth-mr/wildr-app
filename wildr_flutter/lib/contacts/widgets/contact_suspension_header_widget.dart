import 'package:flutter/material.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';

class ContactSuspensionHeaderWidget extends StatelessWidget {
  final ContactInfo contactInfo;
  final double height;

  const ContactSuspensionHeaderWidget(
    this.contactInfo, {
    super.key,
    this.height = 40,
  });

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 15.0),
      height: height,
      width: double.infinity,
      alignment: Alignment.centerLeft,
      child: Text(
        contactInfo.getSuspensionTag().toString(),
        textScaleFactor: 2,
      ),
    );
}
