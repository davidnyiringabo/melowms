'use client';
import AuthLoadingScreen from '../components/AuthLoading';
import app, { auth, db, functions } from '../firebaseConfig';
import { connectFunctionsEmulator } from 'firebase/functions';
import { connectAuthEmulator } from 'firebase/auth';
import React from 'react';
import {
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  FunctionsProvider,
} from 'reactfire';
import CustomAuthProvider from './Auth';

const ReactFire = ({ children }: { children: React.ReactNode }) => {
  if (import.meta.env.MODE !== 'production') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  }
  return (
    <FirebaseAppProvider firebaseApp={app}>
      <AuthProvider sdk={auth}>
        <FirestoreProvider sdk={db}>
          <FunctionsProvider sdk={functions}>
            <AuthLoadingScreen>
              <CustomAuthProvider>{children}</CustomAuthProvider>
            </AuthLoadingScreen>
          </FunctionsProvider>
        </FirestoreProvider>
      </AuthProvider>
    </FirebaseAppProvider>
  );
};

export default ReactFire;
