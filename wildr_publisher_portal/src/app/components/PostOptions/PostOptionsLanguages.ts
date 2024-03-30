import { LanguageCode } from '@/app/utils/languageCodes';

interface IPostOptionsCopy {
  pageTitle: string;
  postTypePost: string;
  postTypeStory: string;
  allowRepostLabel: string;
  postVisibilityLabel: string;
  optionsAll: string;
  optionsFollowers: string;
  optionsNone: string;
  optionsAuthor: string;
  seeCommentLabel: string;
  commentPostLabel: string;
  assignToChallengeLabel: string;
  captionPlaceholder: string;
}

type LanguageToPostOptionsMap = {
  [index: string]: IPostOptionsCopy;
};

export const postOptionsTranslations: LanguageToPostOptionsMap = {
  [LanguageCode.ENGLISH]: {
    pageTitle: 'Options',
    postTypePost: 'Post',
    postTypeStory: 'Story (24 hours)',
    allowRepostLabel: 'Allow Reposts',
    postVisibilityLabel: 'Who can see this post?',
    optionsAll: 'Everyone',
    optionsFollowers: 'Followers',
    optionsNone: 'None',
    optionsAuthor: 'Author',
    seeCommentLabel: 'Who can see the comment?',
    commentPostLabel: 'Who can comment on this post?',
    assignToChallengeLabel: 'Assign to challenge',
    captionPlaceholder: 'Add a caption up to 200 characters...',
  },
};
