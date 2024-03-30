import 'package:firebase_auth/firebase_auth.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:wildr_flutter/constants/constants.dart';

String baseUrl = FlavorConfig.getValue(kBaseWebsiteUrl);

class FeedbackApi {
  static Future<String> sendFeedback(feedback) async {
    Future<String> sendResponse(String feedback, {String? token}) async {
      try {
        final http.Response response = await http.post(
          Uri.parse('$baseUrl/api/feedback'),
          headers: token != null ? {'authorization': token} : null,
          body: {'message': feedback},
        );
        debugPrint(response.body);
        if (response.statusCode == 200) {
          return response.body;
        } else {
          throw Exception(kSomethingWentWrong);
        }
      } catch (e) {
        debugPrint(e.toString());
        throw Exception(kSomethingWentWrong);
      }
    }

    if (FirebaseAuth.instance.currentUser != null) {
      final IdTokenResult token =
          await FirebaseAuth.instance.currentUser!.getIdTokenResult(true);
      if (token.token != null) {
        return sendResponse(feedback, token: token.token);
      } else {
        return sendResponse(feedback);
      }
    } else {
      return sendResponse(feedback);
    }
  }
}
