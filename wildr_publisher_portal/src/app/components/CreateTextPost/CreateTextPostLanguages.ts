import { LanguageCode } from '@/app/utils/languageCodes';

interface ICreateTextPostCopy {
  postCreateSuccess: string;
  postCreateError: string;
  postTextPlaceholder: string;
  createPostButton: string;
}

type LanguageCreateTextPostMap = {
  [index: string]: ICreateTextPostCopy;
};

export const CreateTextPostTranslations: LanguageCreateTextPostMap = {
  [LanguageCode.ENGLISH]: {
    postCreateSuccess: 'Post successfully created',
    postCreateError: 'Failed to create text post',
    postTextPlaceholder: "What's on your mind?",
    createPostButton: 'Create Text Post',
  },
};
