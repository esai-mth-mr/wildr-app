import { WildrLanguageCode } from '@verdzie/server/common/language-code';

interface WaitlistCopy {
  alreadyJoinedWaitlistExceptionMessage: string;
}

type WaitlistCopyLanguageCodeMap = {
  [languageCode in WildrLanguageCode]: WaitlistCopy;
};

export const waitlistCopyMap: WaitlistCopyLanguageCodeMap = {
  [WildrLanguageCode.ENGLISH]: {
    alreadyJoinedWaitlistExceptionMessage:
      'Oops, looks like you already joined!',
  },
};
