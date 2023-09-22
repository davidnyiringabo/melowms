import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';

let currentApp;
try {
  currentApp = admin.initializeApp();
} catch (error) {
  currentApp = admin.apps[0];
  if (typeof currentApp === 'undefined') {
    throw new Error('Admin app initialization failed!');
  }
}

export default admin;

export const app = currentApp as App;
