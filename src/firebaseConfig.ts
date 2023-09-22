// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// import firebaseDevConfig from './environments/environment.dev';
// import firebaseStageConfig from './environments/environment.stage';
import firebaseProd1Config from './environments/environment.prod1';

// Initialize Firebase
const app = initializeApp(
  firebaseProd1Config
  // import.meta.env.FIREBASE_PROJECT === 'dev'
  //   ? firebaseDevConfig
  //   : import.meta.env.FIREBASE_PROJECT === 'prod1'
  //   ? firebaseProd1Config
  //   : firebaseStageConfig
);

export const auth = getAuth(app);
export const functions = getFunctions(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const isServer = typeof window === 'undefined';
console.log(import.meta.env.FIREBASE_PROJECT);
console.log(import.meta.env.MODE);
if (import.meta.env.MODE !== 'production') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
