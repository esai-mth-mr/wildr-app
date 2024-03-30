// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'main_bloc.dart';

extension MainBlocEventHandler on MainBloc {
  void _registerEventHandlers() {
    print('Registering Event Handlers');
    on<MainBlocEvent>((event, emit) async {
      if (event is ScrollToTheTopOfFeedListEvent) {
        emit(ScrollToTheTopOfHomeFeedState());
      } else if (event is ScrollToTheTopOfExploreFeedEvent) {
        emit(ScrollToTheTopOfExploreFeedState());
      } else if (event is ScrollToTheTopOfCurrentUserPageEvent) {
        emit(ScrollToTheTopOfCurrentUserPageState());
      } else if (event is EmptyEvent) {
        emit(EmptyState());
      } else if (event is OnFeedWidgetChangedEvent) {
        emit(FeedWidgetChangedState(event.index, event.pageId));
      } else if (event is FeedPageChangedEvent) {
        emit(FeedPageChangedState(event.index));
      } else if (event is NavigateToTabEvent) {
        emit(NavigateToTab(event.tab));
      } else if (event is GoToCameraEvent) {
        emit(GoToCameraState());
      } else if (event is DraftUpdatedEvent) {
        emit(DraftUpdatedState());
      } else if (event is ThemeBrightnessToggledEvent) {
        emit(ThemeBrightnessToggeledState());
      } else if (event is OpenCreatePostBottomSheetEvent) {
        emit(OpenCreatePostBottomSheetState(shouldOpen: event.shouldOpen));
      } else if (event is CloseCreatePostPageEvent) {
        emit(CloseCreatePostPageState());
      } else if (event is CanPaginateHomeFeedEvent) {
        emit(CanPaginateHomeFeedState(event.canPaginate));
      } else if (event is TriggerCommentOnboardingFromCommentsPageEvent) {
        emit(TriggerCommentOnboardingFromCommentsPageState());
      } else if (event is OtpVerificationFailedEvent) {
        emit(OtpVerificationFailedState());
      } else if (event is SwitchedToSearchTabEvent) {
        emit(SwitchedToSearchTabState());
      } else if (event is ToggleViewOnlyModeEvent) {
        emit(ToggleViewOnlyModeState(hideAll: event.shouldHideAll));
      } else if (event is AppAuthenticatedEvent) {
        await _onJwtTokenAvailable(emit, event);
      } else if (event is AppUnauthenticatedEvent) {
        emit(AppUnauthenticatedState());
        await _sendGqlEvent(GetFeatureFlagsEvent());
      } else if (event is PerformLogoutEvent) {
        await _onPerformLogoutEvent(emit, event);
      } else if (event is TriggerLikeEvent) {
        emit(TriggerLikeState());
      } else if (event is ServerUrlChangedEvent) {
        await _serverUrlChanged(event);
      } else if (event is RefreshCurrentUserPageEvent) {
        emit(RefreshCurrentUserPageState());
      } else if (event is GoToUserListEvent) {
        emit(GoToUserListState(event.userListType));
      } else if (event is SendEmailAndShowDialogEvent) {
        emit(SendEmailAndShowDialogState());
      } else if (event is RefreshUserListPageEvent) {
        emit(RefreshUserListPageState(event.id));
      } else if (event is FinishOnboardingEvent) {
        switch (event.type) {
          case OnboardingType.INNER_CIRCLE:
            currentUserGxC.user.onboardingStats.innerCircle = true;
          case OnboardingType.COMMENT_REPLY_LIKES:
            currentUserGxC.user.onboardingStats.commentReplyLikes = true;
          case OnboardingType.CHALLENGES:
            currentUserGxC.user.onboardingStats.challenges = true;
          case OnboardingType.CHALLENGE_EDUCATION:
            currentUserGxC.user.onboardingStats.challengeEducation = true;
        }
        await _sendGqlEvent(event);
      } else if (event is SkipOnboardingEvent) {
        switch (event.type) {
          case OnboardingType.INNER_CIRCLE:
            currentUserGxC.user.onboardingStats.innerCircle = true;
          case OnboardingType.COMMENT_REPLY_LIKES:
            currentUserGxC.user.onboardingStats.commentReplyLikes = true;
          case OnboardingType.CHALLENGES:
            currentUserGxC.user.onboardingStats.challenges = true;
          case OnboardingType.CHALLENGE_EDUCATION:
            currentUserGxC.user.onboardingStats.challengeEducation = true;
        }
        await _sendGqlEvent(event);
      } else if (event is UpdateSensitiveContentEvent) {
        emit(UpdateSensitiveContentState(event.feedOverlay));
      } else if (event is InitCreateChallengeEvent) {
        emit(InitCreateChallengeState());
      } else if (event is ReloadFirebaseUserEvent) {
        await _reloadFirebaseUser();
      } else {
        await _sendGqlEvent(event);
      }
    });
  }
}
