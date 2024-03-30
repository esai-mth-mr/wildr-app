export enum AppRouteEnums {
  CHALLENGE_ONBOARDING = 'CHALLENGE_ONBOARDING',
  CHALLENGE_HOME_TAB = 'CHALLENGE_HOME_TAB',
  CHALLENGE_EDUCATION = 'CHALLENGE_EDUCATION',
  SINGLE_CHALLENGE_PAGE = 'SINGLE_CHALLENGE_PAGE',
  SINGLE_POST_PAGE = 'SINGLE_POST_PAGE',
  PROFILE_PAGE = 'PROFILE_PAGE',
}

export class AppRoutes {
  static getChallengeAnnouncementRoute(): string {
    return [
      AppRouteEnums.CHALLENGE_ONBOARDING,
      AppRouteEnums.CHALLENGE_HOME_TAB,
    ].join('/');
  }
}
