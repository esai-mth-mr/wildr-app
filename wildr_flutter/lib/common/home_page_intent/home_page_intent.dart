class HomePageIntent {
  final HomePageIntentType type;
  final ObjectId? objectId;
  final HomePageIntent? nextIntent;

  HomePageIntent(this.type, this.objectId, [this.nextIntent]);

  static OnboardingPageBodyData toOnboardingPageBody(HomePageIntent intent) {
    switch (intent.type) {
      case HomePageIntentType.SINGLE_CHALLENGE:
        return OnboardingPageBodyData(
          OnboardingPageBodyType.SINGLE_CHALLENGE,
          intent.objectId?.challengeId,
        );
      case HomePageIntentType.POST:
        return OnboardingPageBodyData(
          OnboardingPageBodyType.POST,
          intent.objectId?.postId,
        );
      case HomePageIntentType.USER:
        return OnboardingPageBodyData(
          OnboardingPageBodyType.USER,
          intent.objectId?.userId,
        );
      default:
        return OnboardingPageBodyData(
          OnboardingPageBodyType.UNDEFINED,
          null,
        );
    }
  }
}

class ObjectId {
  final String? objectId;
  final String? postId;
  final String? challengeId;
  final String? commentId;
  final String? replyId;
  final String? userId;
  final String? inviteCode;

  ObjectId({
    this.objectId,
    this.postId,
    this.challengeId,
    this.commentId,
    this.replyId,
    this.userId,
    this.inviteCode,
  });

  ObjectId.empty()
      : objectId = null,
        postId = null,
        challengeId = null,
        commentId = null,
        replyId = null,
        inviteCode = null,
        userId = null;

  ObjectId.inviteCode(this.inviteCode)
      : objectId = null,
        postId = null,
        challengeId = null,
        commentId = null,
        replyId = null,
        userId = null;

  ObjectId.challenge(this.challengeId)
      : objectId = null,
        postId = null,
        commentId = null,
        replyId = null,
        inviteCode = null,
        userId = null;

  ObjectId.post(this.postId)
      : objectId = null,
        challengeId = null,
        commentId = null,
        replyId = null,
        inviteCode = null,
        userId = null;

  ObjectId.commentFromPost(this.commentId, this.postId)
      : objectId = null,
        challengeId = null,
        replyId = null,
        inviteCode = null,
        userId = null;

  ObjectId.commentFromChallenge(this.commentId, this.challengeId)
      : objectId = null,
        postId = null,
        replyId = null,
        inviteCode = null,
        userId = null;

  ObjectId.replyFormPost(this.replyId, this.commentId, this.postId)
      : objectId = null,
        challengeId = null,
        inviteCode = null,
        userId = null;

  ObjectId.replyFromChallenge(this.replyId, this.commentId, this.challengeId)
      : objectId = null,
        postId = null,
        inviteCode = null,
        userId = null;

  ObjectId.user(this.userId)
      : objectId = null,
        postId = null,
        challengeId = null,
        commentId = null,
        inviteCode = null,
        replyId = null;

  bool isValidForReplyNavigation() =>
      replyId != null &&
      commentId != null &&
      (postId != null || challengeId != null);

  bool isValidForCommentNavigation() =>
      commentId != null && (postId != null || challengeId != null);
}

enum HomePageIntentType {
  UNDEFINED,
  LOGIN,
  SIGNUP,
  NOTIFICATIONS_PAGE,

  // <-- requires objectId --->
  SINGLE_CHALLENGE,
  POST,
  USER,
  COMMENT,
  REPLY,
  REDEEM_INVITE_CODE,
  REDEEM_INVITE_CODE_WITH_ACTION,
}

class OnboardingPageBodyData {
  final OnboardingPageBodyType type;
  final String? objectId;

  OnboardingPageBodyData(this.type, this.objectId);
}

enum OnboardingPageBodyType {
  UNDEFINED,
  SINGLE_CHALLENGE,
  POST,
  USER,
}
