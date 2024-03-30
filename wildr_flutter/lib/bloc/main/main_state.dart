// ignore_for_file: avoid_positional_boolean_parameters

part of 'main_bloc.dart';

abstract class MainState extends GqlIsolateState {
  MainState();
}

class InitCreateChallengeState extends MainState {}

@Deprecated("Use ObservableQuery's fetchMore function")
class PaginateFeedDataSuccessState extends MainState {
  final List<Post> posts;
  final String endCursor;

  PaginateFeedDataSuccessState(this.posts, this.endCursor) : super();
}

class VisiblePostState extends MainState {
  final Post visiblePost;

  VisiblePostState(this.visiblePost) : super();
}

class ScrollToTheTopOfHomeFeedState extends MainState {}

class ScrollToTheTopOfExploreFeedState extends MainState {}

class ScrollToTheTopOfCurrentUserPageState extends MainState {}

class FeedWidgetChangedState extends MainState {
  final int itemIndex;
  final String pageId;

  FeedWidgetChangedState(this.itemIndex, this.pageId)
      : /*number = DateTime.now().millisecondsSinceEpoch,*/ super();

  // TODO: implement props
  List<Object?> get props => throw UnimplementedError();
}

class GetChallengePinnedCommentState extends MainState {
  final String challengeId;
  final Challenge? challenge;
  final String? errorMessage;

  GetChallengePinnedCommentState({
    required this.challengeId,
    this.challenge,
    this.errorMessage,
  });
}

///Creation
class NewPostCreatedState extends MainState {
  final bool isStory;
  final String? parentChallengeId;

  NewPostCreatedState(this.parentChallengeId, {required this.isStory});
}

class PostCreationFailedState extends MainState {
  final String? message;

  PostCreationFailedState({this.message});
}

class PostCreationInProgressState extends MainState {}

class PostCreationErrorState extends MainState {
  final String message;

  PostCreationErrorState(this.message) : super();
}

class PostCreationSuccessfulState extends MainState {}

class EmptyState extends MainState {}

///Get User
class GetUserDataSuccessState extends MainState {
  final WildrUser user;

  GetUserDataSuccessState(this.user) : super();
}

class GetUserDataFailedState extends MainState {
  final String toastMessage;

  GetUserDataFailedState(this.toastMessage) : super();
}

class NavigateToTab extends MainState {
  final HomeTab tab;

  NavigateToTab(this.tab) : super();
}

class GoToCameraState extends MainState {}

class DraftUpdatedState extends MainState {}

class StartRecordingState extends MainState {}

class StopRecordingState extends MainState {}

@Deprecated('')
class PaginatedCurrentUserPostsState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;
  final List<Post>? posts;
  final String? endCursor;

  PaginatedCurrentUserPostsState({
    required this.isSuccessful,
    this.errorMessage,
    this.posts,
    this.endCursor,
  }) : super();
}

///Misc
class GServiceReinitatedWithHeaderState extends MainState {}

class ReloadFeedState extends MainState {}

///Delete

class DeletePostState extends MainState {
  final bool isSuccessful;
  final int index;
  final String? errorMessage;
  final String postId;

  DeletePostState({
    this.isSuccessful = true,
    required this.index,
    this.errorMessage,
    required this.postId,
  });
}

class GetSinglePostDataUpdateState extends MainState {
  final String id;
  final String? errorMessage;
  final Post? post;
  final bool isLoading;

  GetSinglePostDataUpdateState(
    this.id, {
    this.errorMessage,
    this.post,
    this.isLoading = false,
  });
}

class DeleteFirebaseUserState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;

  DeleteFirebaseUserState({this.isSuccessful = true, this.errorMessage});
}

///Misc
class ThemeBrightnessToggeledState extends MainState {}

class OpenCreatePostBottomSheetState extends MainState {
  final bool shouldOpen;

  OpenCreatePostBottomSheetState({this.shouldOpen = true});
}

class CloseCreatePostPageState extends MainState {}

class PostTrollingDetectedState extends MainState {
  final List<PostData> postData;
  final PostTrollDetectedData data;

  PostTrollingDetectedState(this.data, this.postData);
}

class PaginateBlockListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;

  PaginateBlockListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
  });
}

class CurrentUserUpdatedState extends MainState {}

class LogoutFailedState extends MainState {}

// class LogoutSuccessfulState extends MainState {}

class FeedPageChangedState extends MainState {
  final int index;

  FeedPageChangedState(this.index);
}

class CheckPhoneNumberAccountExistsState extends MainState {
  final bool phoneNumberAccountExist;

  CheckPhoneNumberAccountExistsState({required this.phoneNumberAccountExist});
}

class CheckPhoneNumberAccountFailedState extends MainState {
  final String errorMessage;

  CheckPhoneNumberAccountFailedState({this.errorMessage = kSomethingWentWrong});
}

class CheckEmailResult extends MainState {
  final bool doesExist;
  final String? errorMessage;

  CheckEmailResult({this.errorMessage, this.doesExist = false});
}

class CheckHandleResultState extends MainState {
  final bool doesExist;
  final String? errorMessage;

  CheckHandleResultState({this.errorMessage, this.doesExist = false});
}

class Check3rdPartyResult extends MainState {
  final bool doesExist;
  final String? errorMessage;

  Check3rdPartyResult({this.errorMessage, this.doesExist = false});
}

class GetDetailsFrom3rdPartyUidResult extends MainState {
  final String? name;
  final String? email;
  final String? errorMessage;

  GetDetailsFrom3rdPartyUidResult({this.errorMessage, this.name, this.email});
}

class CommentEmbargoOnboardingErrorState extends MainState {}

class CurrentUserDataUpdatedState extends MainState {}

class RequestDeleteUserState extends MainState {
  final String? errorMessage;

  RequestDeleteUserState({this.errorMessage});
}

class TriggerCommentOnboardingFromCommentsPageState extends MainState {}

class OtpVerificationFailedState extends MainState {}

class SwitchedToSearchTabState extends MainState {}

class ToggleViewOnlyModeState extends MainState {
  final bool hideAll;

  ToggleViewOnlyModeState({required this.hideAll});
}

class RequestForInviteCodeState extends MainState {}

class GenerateInviteCodeResultState extends MainState {
  final String? errorMessage;
  final int? inviteCode;
  final String? phoneNumber;
  final UserListType? userListType;
  final String? pageId;
  final InviteCodeAction? action;

  GenerateInviteCodeResultState(
    GenerateInviteCodeEvent event, {
    this.errorMessage,
    this.inviteCode,
  })  : phoneNumber = event.phoneNumber,
        userListType = event.userListType,
        pageId = event.pageId,
        action = event.inviteCodeAction;
}

class RemovePrefKeyState extends MainState {
  final String key;

  RemovePrefKeyState(this.key);
}

class AddStringPrefKeyState extends MainState {
  final String key;
  final String value;

  AddStringPrefKeyState(this.key, this.value);
}

class LogFirebaseState extends MainState {
  final String eventName;
  final Map<String, Object?>? parameters;
  final bool? isSuccessful;

  LogFirebaseState(
    this.eventName,
    this.parameters, {
    required this.isSuccessful,
  });
}

abstract class UserListState extends MainState {
  late final String? errorMessage;
  late final List<WildrUser>? users;
  late final String? startCursor;
  late final String? endCursor;
  late final bool? isSuggestion;
  late final UserListType userListType;
}

class ShowInnerCircleOnboardingState extends MainState {}

class CheckInviteCodeResultState extends MainState {
  final String? errorMessage;
  final String? payload;

  CheckInviteCodeResultState(this.errorMessage, this.payload);
}

class OnFeedScopeTypeChangedState extends MainState {
  final FeedPostType postType;
  final FeedScopeType scopeType;
  final bool isAuthenticated;

  OnFeedScopeTypeChangedState({
    required this.postType,
    required this.scopeType,
    required this.isAuthenticated,
  });
}

class FinishOnboardingState extends MainState {
  final OnboardingType onboardingType;

  FinishOnboardingState(this.onboardingType);
}

class RequestPaginateCurrentUserActivityEventState extends MainState {}

class ChallengeInviteCodeGeneratedState extends MainState {}

abstract class AuthStateChangedState extends MainState {}

class AuthenticationSuccessfulState extends AuthStateChangedState {}

class AppUnauthenticatedState extends AuthStateChangedState {}

class LogoutForcefullyState extends MainState {}
