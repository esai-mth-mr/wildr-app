'use client';
import { SetStateAction, useCallback, useState } from 'react';
import {
  theme,
  Button,
  FormGroup,
  SignInFormWrapper,
  SignInLabel,
  SignInContainer,
  SignInTitle,
  SignInInput,
  SocialLogin,
  GoogleSignInButton,
  AppleSignInButton,
  Separator,
  Caption,
} from '@/app/components/SignInForm/SignInFormComponents';
import { ThemeProvider } from 'styled-components';
import { OtpConfirmParams, useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { signInTranslations } from '@/app/components/SignInForm/SignInLanguages';
import { useMutation } from '@apollo/client';
import {
  FIREBASE_EMAIL_AUTHENTICATION,
  FIREBASE_PHONE_NUMBER_AUTHENTICATION,
  FIREBASE_SIGNUP,
} from '@/graphql/queries';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { DEFAULT_LANGUAGE, JWT_TOKEN, USER_ID } from '@/app/utils/constants';
interface IAuthenticateUserEmail {
  email: string;
  phoneNumber?: never;
  accessToken: string;
  uid: string;
}

interface IAuthenticateUserPhoneNumber {
  email?: never;
  phoneNumber: string;
  accessToken: string;
  uid: string;
}

interface IAuthenticateUserBoth {
  email: string | null | undefined;
  phoneNumber: string;
  accessToken: string;
  uid: string;
}

type AuthenticateUserParams =
  | IAuthenticateUserEmail
  | IAuthenticateUserPhoneNumber
  | IAuthenticateUserBoth;

type AuthenticationResponse = {
  success: boolean;
  userId?: string;
  jwtToken?: string;
};

interface ISignUpUser extends IAuthenticateUserBoth {
  language: string;
}

const handleAppleSignIn = () => {
  // Handle Apple login/
  console.log('Logging in via Apple');
};

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState({});
  const [showOTP, setShowOTP] = useState(false);
  const [firebaseEmailAuthentication] = useMutation(
    FIREBASE_EMAIL_AUTHENTICATION
  );
  const [firebasePhoneNumberAuthentication] = useMutation(
    FIREBASE_PHONE_NUMBER_AUTHENTICATION
  );
  const [firebaseSignUp] = useMutation(FIREBASE_SIGNUP);
  const router = useRouter();

  const {
    language,
    user,
    googleSignIn,
    credentialsSignIn,
    phoneSignIn,
    otpConfirm,
    signOut,
  } = useAuth();

  const authenticateUser = async ({
    email,
    phoneNumber,
    accessToken,
    uid,
  }: AuthenticateUserParams): Promise<AuthenticationResponse> => {
    if (email) {
      try {
        const { data } = await firebaseEmailAuthentication({
          context: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
          variables: {
            input: {
              email,
              uid,
            },
          },
        });
        setCookie(USER_ID, data.firebaseEmailAuthentication.user.id);
        setCookie(JWT_TOKEN, data.firebaseEmailAuthentication.jwtToken);
        return {
          success: true,
          userId: data.firebaseEmailAuthentication.user.id,
          jwtToken: data.firebaseEmailAuthentication.jwtToken,
        };
      } catch (error) {
        return { success: false };
      }
    }

    if (phoneNumber) {
      try {
        const { data } = await firebasePhoneNumberAuthentication({
          context: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
          variables: {
            input: {
              phoneNumber,
              uid,
            },
          },
        });
        setCookie(USER_ID, data.firebasePhoneNumberAuthentication.user.id);
        setCookie(JWT_TOKEN, data.firebasePhoneNumberAuthentication.jwtToken);
        return {
          success: true,
          userId: data.firebasePhoneNumberAuthentication.user.id,
          jwtToken: data.firebasePhoneNumberAuthentication.jwtToken,
        };
      } catch (error) {
        return { success: false };
      }
    }
    return { success: false };
  };

  const signUpUser = async ({
    phoneNumber,
    email,
    accessToken,
    uid,
  }: ISignUpUser) => {
    try {
      const { data } = await firebaseSignUp({
        context: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        variables: {
          input: {
            email: email,
            phoneNumber: phoneNumber,
            uid: uid,
            handle: email === undefined && phoneNumber,
            language: DEFAULT_LANGUAGE,
          },
        },
      });

      setCookie(JWT_TOKEN, data.firebaseSignup.jwtToken);
      setCookie(USER_ID, data.firebaseSignup.user.id);
      return true;
    } catch (error) {
      console.error('Error during user signup:', error);
      return false;
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    const res = await googleSignIn();
    if (res.isOk()) {
      const { email, accessToken, uid } = res.value;
      try {
        const authenticateUserResult = await authenticateUser({
          email,
          phoneNumber: '',
          accessToken,
          uid,
        });
        if (!authenticateUserResult) {
          await signUpUser({
            email,
            phoneNumber: '',
            accessToken,
            uid,
            language: DEFAULT_LANGUAGE,
          });
        }
        router.push('/');
      } catch (error) {
        signOut();
        console.log(error);
        toast.error(signInTranslations[language].googleSignInErrorMessage);
      }
      toast.success(signInTranslations[language].googleSignInSuccessMessage);
    }
    if (res.isErr()) {
      toast.error(signInTranslations[language].googleSignInErrorMessage);
    }
  }, [user]);

  const handleCredentialsSignIn = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const res = await credentialsSignIn({ email, password });
      if (res.isErr()) {
        toast.error(signInTranslations[language].credentialsSignInErrorMessage);
        return;
      }
      try {
        const { accessToken, uid } = res.value;
        await authenticateUser({ email, accessToken, uid });
        toast.success(
          signInTranslations[language].credentialsSignInSuccessMessage
        );
        router.push('/');
      } catch (error) {
        signOut();
        console.log(error);
        toast.error(signInTranslations[language].credentialsSignInErrorMessage);
      }
    },
    [email, password]
  );
  const handlePhoneSignIn = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const res = await phoneSignIn({ phone });
      if (res.isErr()) {
        toast.error(signInTranslations[language].otpSentErrorMessage);
        return;
      }
      setConfirmationResult(res.value);
      setShowOTP(true);
      toast.success(signInTranslations[language].otpSentSuccessMessage);
    },
    [phone]
  );

  const handleVerifyOTP = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const res = await otpConfirm({
        otp,
        confirmationResult,
      } as OtpConfirmParams);
      if (res.isErr()) {
        toast.error(signInTranslations[language].otpIncorrectMessage);
        return;
      }
      try {
        const { phoneNumber, accessToken, uid } = res.value;
        const authenticateUserResult = await authenticateUser({
          phoneNumber,
          accessToken,
          uid,
        });
        if (!authenticateUserResult) {
          await signUpUser({
            phoneNumber,
            accessToken,
            uid,
            email: '',
            language: DEFAULT_LANGUAGE,
          });
        }
        router.push('/');
        toast.success(
          signInTranslations[language].phoneNumberSignInSuccessMessage
        );
      } catch (error) {
        signOut();
        console.log(error);
      }
    },
    [otp]
  );

  return (
    <ThemeProvider theme={theme}>
      <SignInContainer>
        <SignInTitle>{signInTranslations[language].signInTitle}</SignInTitle>
        <SignInFormWrapper onSubmit={handleCredentialsSignIn}>
          <FormGroup>
            <SignInLabel htmlFor="email">
              {signInTranslations[language].signInUsernameLabel}
            </SignInLabel>
            <SignInInput
              type="text"
              id="email"
              value={email}
              required
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setEmail(e.target.value)
              }
            />
          </FormGroup>
          <FormGroup>
            <SignInLabel htmlFor="password">
              {signInTranslations[language].signInPasswordLabel}
            </SignInLabel>
            <SignInInput
              type="password"
              id="password"
              value={password}
              required
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setPassword(e.target.value)
              }
            />
          </FormGroup>
          <Button type="submit">
            {signInTranslations[language].signInText}
          </Button>
        </SignInFormWrapper>
        <Separator>{signInTranslations[language].separator}</Separator>
        {!showOTP && (
          <SignInFormWrapper onSubmit={handlePhoneSignIn}>
            <FormGroup>
              <SignInLabel htmlFor="phone">
                {signInTranslations[language].signInPhoneNumberLabel}
              </SignInLabel>
              <SignInInput
                type="tel"
                id="phone"
                value={phone}
                required
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setPhone(e.target.value)
                }
              />
            </FormGroup>
            <Button type="submit">
              {signInTranslations[language].sendSMSCode}
            </Button>
          </SignInFormWrapper>
        )}
        <div id="recaptcha-container"></div>
        {showOTP && (
          <SignInFormWrapper onSubmit={handleVerifyOTP}>
            <FormGroup>
              <SignInLabel htmlFor="otp">OTP</SignInLabel>
              <SignInInput
                type="tel"
                id="otp"
                value={otp}
                required
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setOtp(e.target.value)
                }
              />
            </FormGroup>
            <Button type="submit">
              {signInTranslations[language].verifyOTP}
            </Button>
          </SignInFormWrapper>
        )}
        <Separator>{signInTranslations[language].separator}</Separator>
        <SocialLogin>
          <GoogleSignInButton onClick={handleGoogleSignIn}>
            {signInTranslations[language].signInWithGoogleButton}
          </GoogleSignInButton>
          <AppleSignInButton onClick={handleAppleSignIn}>
            {signInTranslations[language].signInWithAppleButton}
          </AppleSignInButton>
        </SocialLogin>
        <Caption>
          {signInTranslations[language].accountCaption}{' '}
          <Link href="/sign-up">
            {signInTranslations[language].signUpCaption}
          </Link>
        </Caption>
      </SignInContainer>
    </ThemeProvider>
  );
};

export default SignInForm;
