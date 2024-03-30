import { LanguageCode } from '@/app/utils/languageCodes';

interface IUserDataCopy {
  loading: string;
  error: string;
  welcomeTitle: string;
  followersStats: string;
  followingStats: string;
  innerCircleStats: string;
  challengesStats: string;
  postsStats: string;
}

type LanguageToUserDataMap = {
  [index: string]: IUserDataCopy;
};

export const userDataTranslations: LanguageToUserDataMap = {
  [LanguageCode.ENGLISH]: {
    loading: 'Loading...',
    error: 'No data available',
    welcomeTitle: 'Welcome to Wildr',
    followersStats: 'Followers',
    followingStats: 'Following',
    innerCircleStats: 'Inner Circle',
    challengesStats: 'Challenges',
    postsStats: 'Posts',
  },
};
