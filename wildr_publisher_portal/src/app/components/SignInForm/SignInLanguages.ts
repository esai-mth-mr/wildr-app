import { LanguageCode } from '@/app/utils/languageCodes';
interface ISignInFormCopy {
  credentialsSignInSuccessMessage: string;
  credentialsSignInErrorMessage: string;
  googleSignInSuccessMessage: string;
  googleSignInErrorMessage: string;
  otpSentErrorMessage: string;
  otpSentSuccessMessage: string;
  otpIncorrectMessage: string;
  phoneNumberSignInSuccessMessage: string;
  signInTitle: string;
  signInText: string;
  signInUsernameLabel: string;
  signInPasswordLabel: string;
  signInPhoneNumberLabel: string;
  separator: string;
  sendSMSCode: string;
  verifyOTP: string;
  signInWithGoogleButton: string;
  signInWithAppleButton: string;
  accountCaption: string;
  signUpCaption: string;
}

type LanguageToSignInMap = {
  [index: string]: ISignInFormCopy;
};

export const signInTranslations: LanguageToSignInMap = {
  [LanguageCode.ENGLISH]: {
    credentialsSignInErrorMessage: 'Credentials Sign In Error',
    credentialsSignInSuccessMessage: 'Credentials Sign In Successful',
    googleSignInSuccessMessage: 'Google Sign In Complete',
    googleSignInErrorMessage: 'Google Sign In Error',
    otpSentErrorMessage: 'OTP Sent Error',
    otpSentSuccessMessage: 'OTP Sent Successful',
    otpIncorrectMessage: 'OTP Incorrect',
    phoneNumberSignInSuccessMessage: 'Phone Number Sign In Successful',
    signInTitle: 'Sign In',
    signInText: 'Sign In',
    signInUsernameLabel: 'Username',
    signInPasswordLabel: 'Password',
    signInPhoneNumberLabel: 'Phone Number',
    separator: 'Or',
    sendSMSCode: 'Send Code Via SMS',
    verifyOTP: 'Verify OTP',
    signInWithGoogleButton: 'Sign In with Google',
    signInWithAppleButton: 'Sign In with Apple',
    accountCaption: 'Do not have an account?',
    signUpCaption: 'Sign Up',
  },
};
