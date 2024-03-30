import { LanguageCode } from '@/app/utils/languageCodes';

interface ICreatePostCopy {
  pageTitle: string;
  postTypeText: string;
  postTypeMedia: string;
}

type LanguageToCreatePostMap = {
  [index: string]: ICreatePostCopy;
};

export const createPostTranslations: LanguageToCreatePostMap = {
  [LanguageCode.ENGLISH]: {
    pageTitle: 'Create Post',
    postTypeText: 'Text Post',
    postTypeMedia: 'Media Post',
  },
};
