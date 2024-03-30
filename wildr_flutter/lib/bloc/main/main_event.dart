// ignore_for_file: avoid_positional_boolean_parameters

part of 'main_bloc.dart';

abstract class AnalyticsEvent {
  Map<String, dynamic>? getAnalyticParameters();

  bool shouldLogEvent();
}

class MainBlocEvent implements AnalyticsEvent {
  const MainBlocEvent();

  @override
  Map<String, dynamic>? getAnalyticParameters() => null;

  @override
  bool shouldLogEvent() => true;
}

class MainBlocDoNotLogEvent extends MainBlocEvent {
  @override
  bool shouldLogEvent() => false;
}

class InitCreateChallengeEvent extends MainBlocDoNotLogEvent {}

class PerformLogoutEvent extends MainBlocEvent {
  final bool isForcefullyLoggingUserOut;

  PerformLogoutEvent({this.isForcefullyLoggingUserOut = false});
}

@Deprecated('Use CreatePostEvent')
class CreateTextPostEvent extends MainBlocEvent {
  final String data;
  final String? body;

  CreateTextPostEvent(this.data, {this.body}) : super();

  Map<String, dynamic> getInputVariables() => {
        'createTextPost':
            SmartTextCommon().createContentForSubmission(data, body: body),
      };
}

@Deprecated('Use CreatePostEvent')
class CreateImagePostEvent extends MainBlocEvent {
  final File file;
  final File thumbFile;
  final String data;
  final String body;

  CreateImagePostEvent(this.file, this.thumbFile, this.data, this.body)
      : super();
}

@Deprecated('Use CreatePostEvent')
class CreateVideoPostEvent extends MainBlocEvent {
  final String path;
  final String thumbPath;
  final String data;
  final String body;

  CreateVideoPostEvent(this.path, this.thumbPath, this.data, this.body)
      : super();
}

class PostCreationFailedEvent extends MainBlocEvent {}

class ScrollToTheTopOfFeedListEvent extends MainBlocDoNotLogEvent {}

class ScrollToTheTopOfExploreFeedEvent extends MainBlocDoNotLogEvent {}

class ScrollToTheTopOfCurrentUserPageEvent extends MainBlocDoNotLogEvent {}

class EmptyEvent extends MainBlocDoNotLogEvent {}

class AppendUserIdToHeaderEvent extends MainBlocDoNotLogEvent {
  final String userId;

  AppendUserIdToHeaderEvent(this.userId);
}

class GetChallengePinnedCommentEvent extends MainBlocEvent {
  final String challengeId;

  GetChallengePinnedCommentEvent({required this.challengeId});

  Map<String, dynamic> getInput() => {'challengeId': challengeId};
}

abstract class JwtTokenAvailableEvent extends MainBlocDoNotLogEvent {
  final String jwtToken;

  JwtTokenAvailableEvent(this.jwtToken);
}

class AppAuthenticatedEvent extends JwtTokenAvailableEvent {
  final bool isFromInviteCodePage;

  AppAuthenticatedEvent(
    super.jwtToken, {
    this.isFromInviteCodePage = false,
  });
}

class AppUnauthenticatedEvent extends MainBlocDoNotLogEvent {
  AppUnauthenticatedEvent() : super();
}

class OnFeedWidgetChangedEvent extends MainBlocDoNotLogEvent {
  final int index;
  final String pageId;

  OnFeedWidgetChangedEvent(this.index, this.pageId) : super();
}

@Deprecated('Use ProfileBloc instead')
class GetUserEvent extends MainBlocEvent {
  final String idOfTheUserToGet;
  final bool isGettingMyProfile;

  GetUserEvent(this.idOfTheUserToGet, this.isGettingMyProfile) : super();
}

class ServerUrlChangedEvent extends MainBlocDoNotLogEvent {}

class NavigateToTabEvent extends MainBlocEvent {
  final HomeTab tab;

  NavigateToTabEvent(this.tab) : super();
}

class GoToCameraEvent extends MainBlocEvent {}

class DraftUpdatedEvent extends MainBlocEvent {}

class StartRecordingEvent extends MainBlocEvent {}

class StopRecordingEvent extends MainBlocEvent {}

class DeleteCommentEvent extends MainBlocEvent {
  final String parentPostId;
  final String commentId;
  final int index;

  DeleteCommentEvent(this.parentPostId, this.commentId, this.index);

  Map<String, dynamic> getInput() => {
        'deleteCommentInput': {'commentId': commentId},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kPostId: parentPostId,
        AnalyticsParameters.kCommentId: commentId,
      };
}

class DeletePostEvent extends MainBlocEvent {
  final String postId;
  final int index;

  DeletePostEvent(this.postId, this.index);

  Map<String, dynamic> getInput() => {
        'deletePostInput': {'postId': postId},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kPostId: postId,
      };
}

class GetOrDeleteFirebaseUserEvent extends MainBlocEvent {
  final String uid;
  final String token;

  GetOrDeleteFirebaseUserEvent(this.token, this.uid);
}

class ThemeBrightnessToggledEvent extends MainBlocEvent {}

const DEFAULT_FIRST_COUNT = 15;

class OpenCreatePostBottomSheetEvent extends MainBlocEvent {
  final bool shouldOpen;

  OpenCreatePostBottomSheetEvent({this.shouldOpen = true});
}

class CloseCreatePostPageEvent extends MainBlocEvent {}

class GetSinglePostUpdateEvent extends MainBlocEvent {
  final String id;
  final String? errorMessage;
  final Post? post;
  final bool isLoading;

  GetSinglePostUpdateEvent(
    this.id, {
    this.errorMessage,
    this.post,
    this.isLoading = false,
  });
}

class CurrentUserDataUpdatedEvent extends MainBlocEvent {}

class FeedPageChangedEvent extends MainBlocEvent {
  final int index;

  FeedPageChangedEvent(this.index) : super();
}

class CheckEmailEvent extends MainBlocEvent {
  final String email;

  CheckEmailEvent(this.email) : super();

  Map<String, dynamic> getVariable() => {'email': email};
}

class CheckHandleEvent extends MainBlocEvent {
  final String handle;

  CheckHandleEvent(this.handle) : super();

  Map<String, dynamic> getVariable() => {'handle': handle};

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kHandle: handle};
}

class Check3rdPartyEvent extends MainBlocEvent {
  final String uid;
  final String providerId;

  Check3rdPartyEvent(this.uid, this.providerId) : super();

  Map<String, dynamic> getVariable() => {'uid': uid, 'providerId': providerId};
}

class GetDetailsFrom3rdPartyUidEvent extends MainBlocEvent {
  final String uid;
  final String providerId;

  GetDetailsFrom3rdPartyUidEvent(this.uid, this.providerId) : super();

  Map<String, dynamic> getVariable() => {'uid': uid, 'providerId': providerId};
}

class RequestDeleteEvent extends MainBlocEvent {
  final bool requestDelete;

  RequestDeleteEvent({this.requestDelete = true});
}

class TriggerCommentOnboardingFromCommentsPageEvent extends MainBlocEvent {}

class OtpVerificationFailedEvent extends MainBlocEvent {}

class SwitchedToSearchTabEvent extends MainBlocEvent {}

class ToggleViewOnlyModeEvent extends MainBlocEvent {
  final bool shouldHideAll;

  ToggleViewOnlyModeEvent(this.shouldHideAll);

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kShowViewOnlyMode: !shouldHideAll};
}

class GenerateInviteCodeEvent extends MainBlocEvent {
  final InviteCodeAction? inviteCodeAction;
  final String? phoneNumber;
  final UserListType? userListType;
  final String? pageId;

  GenerateInviteCodeEvent({
    this.inviteCodeAction,
    this.phoneNumber,
    this.userListType,
    this.pageId,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kAction: inviteCodeAction?.name.toString()};
}

class UpdateCurrentUserObjEvent extends MainBlocEvent {
  final WildrUser user;

  UpdateCurrentUserObjEvent(this.user);
}

class FinishOnboardingEvent extends MainBlocEvent {
  final OnboardingType type;

  FinishOnboardingEvent(this.type);

  Map<String, dynamic> getVariables() => {
        'input': {'type': type.name},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kType: type.name};
}

class SkipOnboardingEvent extends MainBlocEvent {
  final OnboardingType type;

  SkipOnboardingEvent(this.type);

  Map<String, dynamic> getVariables() => {
        'input': {'type': type.name},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kType: type.name,
      };
}

class CheckInviteCodeEvent extends MainBlocEvent {
  final int code;

  CheckInviteCodeEvent(this.code);

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kCode: code};
}

class RefreshFirebaseJwtToken extends SystemEvent {
  final String? token;

  RefreshFirebaseJwtToken(this.token);
}

class ReloadFirebaseUserEvent extends SystemEvent {}

// TODO Add a special check for such events which add `debug` prefix
class SystemEvent extends MainBlocEvent {}
