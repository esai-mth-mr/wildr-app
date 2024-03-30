// Import the functions you need from the SDKs you need
import { Analytics, getAnalytics, logEvent } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCWDuwt9kIzDlRXS76zfej7xlpNIhzyuaA',
  authDomain: 'wildr-prod-troll-app.firebaseapp.com',
  projectId: 'wildr-prod-troll-app',
  storageBucket: 'wildr-prod-troll-app.appspot.com',
  messagingSenderId: '464001211089',
  appId: '1:464001211089:web:7ca9ec5e2e1542a02e03f0',
  measurementId: 'G-0VNLZK7WXE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics: Analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
