import * as functions from 'firebase-functions';
import admin, { app } from '../admin';

const auth = admin.auth(app);

type SwitchInfo = {
  branch?: string;
  company?: string;
};

export const switchToAccount = functions.https.onCall(
  async (data: SwitchInfo, context) => {
    const isSuperAdmin = !!context.auth?.token?.superAdmin;
    const isAdmin = !!context.auth?.token?.admin;
    const isSwitched = !!context.auth?.token?.switched;

    if (!isSuperAdmin && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `You're not allowed to perform this action.`
      );
    }

    if (isSwitched) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Your account is already currently switched.`
      );
    }

    if (isAdmin || (isSuperAdmin && data.company && data.branch)) {
      await auth.setCustomUserClaims(context.auth?.uid as string, {
        tinnumber: context.auth?.token.tinnumber,
        branch: data.branch as string,
        manager: true,
        admin: undefined,
        switched: true,
        switchedFrom: isSuperAdmin ? 'superAdmin' : 'admin',
      });
    } else if (isSuperAdmin) {
      await auth.setCustomUserClaims(context.auth?.uid as string, {
        tinnumber: data.company,
        ...(data.branch
          ? { branch: data.branch, manager: true }
          : { admin: true }),
        switched: true,
        superAdmin: false,
        switchedFrom: 'superAdmin',
      });
    }

    return null;
  }
);

export const switchFromAccount = functions.https.onCall(
  async (data, context) => {
    const switchedFrom = context.auth?.token.switchedFrom;
    const isSuperAdmin = switchedFrom === 'superAdmin';
    const isAdmin = switchedFrom === 'admin';

    const isSwitched = !!context.auth?.token?.switched;

    if (!isSuperAdmin && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `You're not allowed to perform this action.`
      );
    }

    if (!isSwitched) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Your account is not currently switched.`
      );
    }

    if (isAdmin) {
      await auth.setCustomUserClaims(context.auth?.uid as string, {
        tinnumber: context.auth?.token.tinnumber,
        branch: undefined,
        manager: undefined,
        admin: true,
        switched: undefined,
        switchedFrom: undefined,
      });
    } else if (isSuperAdmin) {
      await auth.setCustomUserClaims(context.auth?.uid as string, {
        tinnumber: undefined,
        branch: undefined,
        manager: undefined,
        superAdmin: true,
        switched: undefined,
      });
    }

    return null;
  }
);
