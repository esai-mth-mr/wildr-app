'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useRouter } from 'next/navigation';
import { err, ok, Result } from 'neverthrow';
import { LanguageCode } from '@/app/utils/languageCodes';
import { deleteCookie, getCookie } from 'cookies-next';
import { JWT_TOKEN, USER_ID } from '@/app/utils/constants';
import { client } from '@/app/apollo/apolloClient';
import toast from 'react-hot-toast';
import { signUpTranslations } from '@/app/components/SignUpForm/SignUpLanguages';

interface AuthContextProps {
  language: string;
  user: User | null;
  googleSignIn: () => Promise<Result<ResponseData, Error>>;
  credentialsSignIn: ({
    email,
    password,
  }: Credentials) => Promise<Result<ResponseData, Error>>;
  credentialsSignUp: ({
    email,
    password,
  }: Credentials) => Promise<Result<ResponseData, Error>>;
  phoneSignIn({
    phone,
  }: PhoneNumber): Promise<Result<ConfirmationResult, Error>>;
  otpConfirm({
    otp,
    confirmationResult,
  }: OtpConfirmParams): Promise<Result<IUserFromOtp, Error>>;
  signOut: () => void;
}

type ResponseData = {
  message: string;
  uid: string;
  email: string | null;
  accessToken: string;
};

type PhoneNumber = {
  phone: string;
};

interface ConfirmationResult {
  verificationId: string;
  onConfirmation?: (verificationCode: string) => void;
  confirm: (otp: string) => Promise<any>;
}
export interface OtpConfirmParams {
  otp: string;
  confirmationResult: ConfirmationResult;
}
interface Credentials {
  email: string;
  password: string;
}
interface IUserFromOtp {
  phoneNumber: string;
  accessToken: string;
  uid: string;
}

export const AuthContext = createContext<AuthContextProps | undefined>(
  undefined
);

const googleSignIn = async (): Promise<Result<ResponseData, Error>> => {
  try {
    const provider = new GoogleAuthProvider();
    const responseFromFirebase = await signInWithPopup(auth, provider);
    return ok({
      message: 'User Sign In Successfully',
      uid: responseFromFirebase.user.uid,
      email: responseFromFirebase.user.email,
      accessToken: await responseFromFirebase.user.getIdToken(),
    });
  } catch (error) {
    return err(new Error('Failed to sign in with Google'));
  }
};

const credentialsSignIn = async ({
  email,
  password,
}: Credentials): Promise<Result<ResponseData, Error>> => {
  try {
    const responseFromFirebase = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return ok({
      message: 'User Sign In Successfully',
      uid: responseFromFirebase.user.uid,
      email: responseFromFirebase.user.email,
      accessToken: await responseFromFirebase.user.getIdToken(),
    });
  } catch (error) {
    return err(new Error('Failed to sign in with Credentials'));
  }
};

const credentialsSignUp = async ({
  email,
  password,
}: Credentials): Promise<Result<ResponseData, Error>> => {
  try {
    const responseFromFirebase = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return ok({
      message: 'User Sign Up Successfully',
      uid: responseFromFirebase.user.uid,
      email: responseFromFirebase.user.email,
      accessToken: await responseFromFirebase.user.getIdToken(),
    });
  } catch (error: any) {
    console.log('error.code', error.code);
    if (error.code == 'auth/email-already-in-use') {
      const responseFromFirebase = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return ok({
        message: 'User exist in Firebase',
        uid: responseFromFirebase.user.uid,
        email: responseFromFirebase.user.email,
        accessToken: await responseFromFirebase.user.getIdToken(),
      });
    }
    if (error.code == 'auth/weak-password') {
      return err(new Error('Weak password'));
    }
    return err(new Error('Failed to Sign Up with Credentials'));
  }
};

const phoneSignIn = async ({
  phone,
}: PhoneNumber): Promise<Result<ConfirmationResult, Error>> => {
  const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phone,
      appVerifier
    );
    return ok(confirmationResult);
  } catch (error) {
    return err(new Error('Failed to sign in with Phone'));
  }
};

const otpConfirm = async ({
  otp,
  confirmationResult,
}: OtpConfirmParams): Promise<Result<IUserFromOtp, Error>> => {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    return ok(userCredential.user);
  } catch (error) {
    return err(new Error('Failed to confirm OTP'));
  }
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const token = getCookie(JWT_TOKEN);

  const signOut = async () => {
    await firebaseSignOut(auth);
    await client.resetStore();
    deleteCookie(JWT_TOKEN);
    deleteCookie(USER_ID);
  };

  useEffect(() => {
    if (token) {
      router.push('/');
    } else {
      router.push('/sign-in');
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        language: LanguageCode.ENGLISH,
        user,
        googleSignIn,
        credentialsSignIn,
        credentialsSignUp,
        phoneSignIn,
        otpConfirm,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('UserAuth must be used within an AuthContextProvider');
  }
  return context;
};
