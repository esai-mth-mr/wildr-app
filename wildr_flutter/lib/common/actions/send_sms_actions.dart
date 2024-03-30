// ignore_for_file: always_declare_return_types

import 'package:flutter/foundation.dart';
import 'package:flutter_sms/flutter_sms.dart';

class SendSmsActions {
  Future<void> sendSmsToRecipient(String recipient, String message) async {
    await sendSMS(message: message, recipients: [recipient])
        .catchError((onError) {
      debugPrint(onError.toString());
      throw Exception(onError);
    });
  }

  Future<void> sendSmsToRecipients(
    List<String> recipients,
    String message,
  ) async {
    await sendSMS(message: message, recipients: recipients)
        .catchError((onError) {
      throw Exception(onError);
    });
  }
}
