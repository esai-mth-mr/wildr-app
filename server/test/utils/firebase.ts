import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { faker } from '@faker-js/faker';
import { UserEntity } from '@verdzie/server/user/user.entity';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let app: FirebaseApp;

export async function createFirebaseUserWithEmail(email: string): Promise<{
  idToken: string;
  userCredential: UserCredential;
}> {
  if (!app) app = initializeApp(firebaseConfig);
  const auth = getAuth();
  const password = faker.internet.password();
  console.time('createFirebaseUserWithEmail');
  const firebaseUser = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
    .then(userCredential => {
      console.timeEnd('createFirebaseUserWithEmail');
      return userCredential;
    })
    .catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(
        'failed to create user in firebase',
        errorCode,
        errorMessage
      );
    });
  if (!firebaseUser) throw new Error('failed to create user in firebase');
  return {
    idToken: await firebaseUser.user.getIdToken(),
    userCredential: firebaseUser,
  };
}
