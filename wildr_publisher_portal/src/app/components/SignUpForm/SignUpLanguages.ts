import { LanguageCode } from '@/app/utils/languageCodes';
interface ISignUpFormCopy {
  credentialsSignUpSuccessMessage: string;
  credentialsSignUpErrorMessage: string;
  signUpTitle: string;
  signUpText: string;
  signUpUsernameLabel: string;
  signUpPasswordLabel: string;
  accountCaption: string;
  signInCaption: string;
  weakPasswordErrorMessage: string;
}

type LanguageToSignUpMap = {
  [index: string]: ISignUpFormCopy;
};

export const signUpTranslations: LanguageToSignUpMap = {
  [LanguageCode.ENGLISH]: {
    credentialsSignUpSuccessMessage: 'Credentials Sign Up Successful',
    credentialsSignUpErrorMessage: 'Credentials Sign Up Error',
    signUpTitle: 'Sign Up',
    signUpText: 'Sign Up',
    signUpUsernameLabel: 'Username',
    signUpPasswordLabel: 'Password',
    accountCaption: 'Already have an account?',
    signInCaption: 'Sign In',
    weakPasswordErrorMessage:
      'Weak Password - Password should be at least 6 characters',
  },
};
