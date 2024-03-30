import { LanguageCode } from '@/app/utils/languageCodes';

interface ICreateMediaPostCopy {
  selectFileMessage: string;
  createPostButton: string;
}

type LanguageCreateMediaPostMap = {
  [index: string]: ICreateMediaPostCopy;
};

export const CreateMediaPostTranslations: LanguageCreateMediaPostMap = {
  [LanguageCode.ENGLISH]: {
    selectFileMessage: 'Choose a file or drag it here.',
    createPostButton: 'Create Media Post',
  },
};
