import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAcPqbr8ays7Iq9XewIIdCm2bNtKFkE18c',
  authDomain: 'wildr-dev.firebaseapp.com',
  databaseURL: 'https://wildr-dev-default-rtdb.firebaseio.com',
  projectId: 'wildr-dev',
  storageBucket: 'wildr-dev.appspot.com',
  messagingSenderId: '868345598504',
  appId: '1:868345598504:web:4b39e210ae624e093e1b1d',
};

export const firebase = initializeApp(firebaseConfig);

export const firebaseFunctions = getFunctions(firebase);
