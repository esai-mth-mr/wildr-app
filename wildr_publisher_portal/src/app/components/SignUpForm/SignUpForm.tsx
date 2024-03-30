'use client';
import { SetStateAction, useCallback, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import Link from 'next/link';
import {
  theme,
  Button,
  FormGroup,
  SignUpContainer,
  SignUpFormWrapper,
  SignUpInput,
  SignUpLabel,
  SignUpTitle,
  Caption,
} from '@/app/components/SignUpForm/SignUpFormComponents';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';
import { signUpTranslations } from '@/app/components/SignUpForm/SignUpLanguages';
import { useMutation } from '@apollo/client';
import { FIREBASE_SIGNUP } from '@/graphql/queries';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { DEFAULT_LANGUAGE, JWT_TOKEN, USER_ID } from '@/app/utils/constants';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { credentialsSignUp, language } = useAuth();
  const [firebaseSignUp] = useMutation(FIREBASE_SIGNUP);
  const router = useRouter();

  const handleCredentialsSignUp = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const res = await credentialsSignUp({ email, password });
      if (res.isErr()) {
        if (res.error.message == 'Weak password') {
          toast.error(signUpTranslations[language].weakPasswordErrorMessage);
        } else {
          toast.error(
            signUpTranslations[language].credentialsSignUpErrorMessage
          );
        }
        return;
      }
      try {
        const { data } = await firebaseSignUp({
          context: {
            headers: {
              Authorization: `Bearer ${res.value.accessToken}`,
            },
          },
          variables: {
            input: {
              email: email,
              uid: res.value.uid,
              handle: email,
              language: DEFAULT_LANGUAGE,
            },
          },
        });
        setCookie(JWT_TOKEN, data.firebaseSignup.jwtToken);
        setCookie(USER_ID, data.firebaseSignup.user.id);
        toast.success(
          signUpTranslations[language].credentialsSignUpSuccessMessage
        );
        router.push('/');
      } catch (error) {
        console.error('Error during user signup:', error);
        toast.error(signUpTranslations[language].credentialsSignUpErrorMessage);
      }
    },
    [email, password]
  );

  return (
    <ThemeProvider theme={theme}>
      <SignUpContainer>
        <SignUpTitle>{signUpTranslations[language].signUpTitle}</SignUpTitle>
        <SignUpFormWrapper onSubmit={handleCredentialsSignUp}>
          <FormGroup>
            <SignUpLabel htmlFor="email">
              {signUpTranslations[language].signUpUsernameLabel}
            </SignUpLabel>
            <SignUpInput
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
            <SignUpLabel htmlFor="password">
              {signUpTranslations[language].signUpPasswordLabel}
            </SignUpLabel>
            <SignUpInput
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
            {signUpTranslations[language].signUpText}
          </Button>
        </SignUpFormWrapper>
        <Caption>
          {signUpTranslations[language].accountCaption}{' '}
          <Link href="/sign-in">
            {signUpTranslations[language].signInCaption}
          </Link>
        </Caption>
      </SignUpContainer>
    </ThemeProvider>
  );
};

export default SignUpForm;
