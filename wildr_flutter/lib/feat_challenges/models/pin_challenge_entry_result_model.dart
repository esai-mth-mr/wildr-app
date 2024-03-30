import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class PinChallengeEntryResult {
  late String? challengeId;
  late bool? isPinnedToChallenge;

  PinChallengeEntryResult({
    required this.challengeId,
    required this.isPinnedToChallenge,
  });

  PinChallengeEntryResult.fromJson(Map<String, dynamic> json) {
    challengeId = json['challenge']['id'] == null
        ? null
        : Challenge.fromJson(json['challenge']).id;

    if (json['entry']['isPinnedToChallenge'] == null) {
      isPinnedToChallenge = null;
      return;
    }
    isPinnedToChallenge = Post.fromNode(json['entry']).isPinnedToChallenge;
  }
}
