import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import { ActionCodeSettings, UserRecord } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { CallableContext } from 'firebase-functions/v1/https';
import { NewUser } from '../types';
import {
  userUpdateValidate,
  userDeleteValidate,
  userCreateValidate,
} from '../validations';
import { App } from 'firebase-admin/app';

const db = admin.firestore(app as App);

export * from './switchAccount';

const actionSettings: ActionCodeSettings = {
  url: functions.config().frontend?.url ?? 'https://melo-wms.web.app/',
};

export const updateUser = functions.https.onCall(async (data, context) => {
  let userClaims = data.claims as UserClaims;

  const userToUpdate = await admin.auth(app).getUser(data.uid);
  checkCanModifyUser(context, userToUpdate);
  checkCanSetClaims(context, userClaims);
  checkDataValid(data, userUpdateValidate);

  try {
    const uid = data.uid as string;
    delete data.uid;
    if (userClaims) {
      await admin.auth(app).setCustomUserClaims(uid, userClaims);
    }

    if (userClaims.tinnumber)
      await checkPathExists(`companies/${userClaims.tinnumber}`, 'Company');
    if (userClaims.branch)
      await checkPathExists(
        `companies/${userClaims.tinnumber}/branches/${userClaims.branch}`,
        'Branch'
      );

    const emailNotVerified =
      userToUpdate.emailVerified &&
      data.email &&
      data.email !== userToUpdate.email;

    const updatedUser = await admin.auth(app).updateUser(uid, {
      ...data,
      ...(emailNotVerified ? { emailVerified: false } : {}),
    });
    await handleSaveUserData(updatedUser, true);

    if (!emailNotVerified) {
      const verificationLink = await admin
        .auth(app)
        .generateEmailVerificationLink(
          updatedUser.email as string,
          actionSettings
        );
      await db.collection('trigger_mail').add({
        to: updatedUser.email,
        message: {
          subject: 'Welcome to Melo WMS!',
          html: generateVerificationEmailTemplate(
            updatedUser.displayName as string,
            verificationLink
          ),
        },
      });
    }

    return updatedUser;
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      error?.message ?? 'Unexpected error occured, try again later.',
      error?.details ?? []
    );
  }
});

export const deleteUser = functions.https.onCall(async (data, context) => {
  try {
    const user = await admin.auth(app).getUser(data.uid);
    checkCanModifyUser(context, user);

    checkDataValid(data, userDeleteValidate);

    await admin.auth(app).deleteUser(user.uid);
    await handleDeleteUserData(user);
    return {
      message: 'User deleted successfully',
    };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      error?.message ?? 'Unexpected error occured, try again later.',
      error?.details ?? []
    );
  }
});
type Claim = 'admin' | 'superAdmin' | 'manager' | 'tinnumber' | 'branch';
type UserClaims = {
  [K in Claim]?: boolean | string;
};

export const onCreateUser = functions.auth
  .user()
  .onCreate(async (user, context) => {
    if (functions.config().superadmin.email === user.email) {
      await admin.auth(app).setCustomUserClaims(user.uid, { superAdmin: true });
    }
    return null;
  });

export const createUser = functions.https.onCall(async (data, context) => {
  let userClaims = data.claims as UserClaims;
  checkCanSetClaims(context, userClaims);
  checkDataValid(data, userCreateValidate);

  const { email, displayName, phoneNumber, password } = data as NewUser;

  try {
    const userData = {
      displayName,
      email,
      password,
      phoneNumber,
    };
    if (!userData.phoneNumber) {
      delete userData.phoneNumber;
    }

    if (userClaims.tinnumber)
      await checkPathExists(`companies/${userClaims.tinnumber}`, 'Company');
    if (userClaims.branch)
      await checkPathExists(
        `companies/${userClaims.tinnumber}/branches/${userClaims.branch}`,
        'Branch'
      );

    const user = await admin.auth(app).createUser(userData);
    await admin.auth(app).setCustomUserClaims(user.uid, userClaims);
    const userWithClaims = await admin.auth(app).getUser(user.uid);
    await handleSaveUserData(userWithClaims);

    const verificationLink = await admin
      .auth(app)
      .generateEmailVerificationLink(user.email as string, actionSettings);

    await db.collection('trigger_mail').add({
      to: user.email,
      message: {
        subject: 'Welcome to Melo WMS!',
        html: generateVerificationEmailTemplate(
          user.displayName as string,
          verificationLink
        ),
      },
    });

    return user;
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      error?.message ?? 'Unexpected error occured, try again later.',
      error?.details ?? []
    );
  }
});

async function handleDeleteUserData(user: UserRecord) {
  await admin.firestore(app).doc(getUserCollectionInfo(user)).delete();
}
async function handleSaveUserData(user: UserRecord, isUpdate = false) {
  const userClaims: UserClaims = user.customClaims as UserClaims;

  const collectionInfo = getUserCollectionInfo(user);
  const data = {
    uid: user.uid,
    superAdmin: userClaims && userClaims['superAdmin'] ? true : false,
    admin: userClaims && userClaims['admin'] ? true : false,
    manager:
      userClaims && userClaims['manager'] ? userClaims['manager'] : false,
    tinnumber:
      userClaims && userClaims['tinnumber'] ? userClaims['tinnumber'] : '',
    branch: userClaims && userClaims['branch'] ? userClaims['branch'] : 'main',
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName || '',
    disabled: user.disabled,
    photoURL: user.photoURL || '',
    phoneNumber: user.phoneNumber || '',
    ...(isUpdate
      ? { updatedTime: FieldValue.serverTimestamp() }
      : {
          updatedTime: FieldValue.serverTimestamp(),
          createdTime: FieldValue.serverTimestamp(),
        }),
  };

  await admin.firestore(app).doc(collectionInfo).set(data, { merge: true });
}

function checkCanSetClaims(context: CallableContext, userClaims: UserClaims) {
  const isSuperAdmin = !!context.auth?.token?.superAdmin;
  const isAdmin = !!context.auth?.token?.admin;
  const isManager = !!context.auth?.token?.manager;

  const hasPerms =
    isSuperAdmin ||
    (isAdmin && !(userClaims['admin'] || userClaims['superAdmin'])) ||
    (isManager &&
      !(
        userClaims['manager'] ||
        userClaims['admin'] ||
        userClaims['superAdmin']
      ));

  if (!hasPerms) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not allowed to perform this action.'
    );
  }
}

function checkCanModifyUser(context: CallableContext, user: UserRecord): void {
  const isSuperAdmin = userHasAllClaims(
    { superAdmin: true },
    context.auth?.token as UserClaims
  );
  const isAdminFromSameCompany = userHasAllClaims(
    { admin: true, tinnumber: user.customClaims?.tinnumber },
    context.auth?.token as UserClaims
  );
  const isManagerFromSameBranch = userHasAllClaims(
    {
      manager: true,
      tinnumber: user.customClaims?.tinnumber,
      branch: user.customClaims?.branch,
    },
    context.auth?.token as UserClaims
  );

  if (!isSuperAdmin && !isAdminFromSameCompany && !isManagerFromSameBranch) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not allowed to perform this action.'
    );
  }
}
function checkDataValid(
  data: any,
  validator: (data: any) => any & { error: any }
) {
  const { error } = validator(data);
  if (error)
    throw new functions.https.HttpsError(
      'invalid-argument',
      error.message,
      error.details
    );
}

async function checkPathExists(docPath: string, fieldName: string) {
  if (!(await admin.firestore(app).doc(docPath).get()).exists) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${fieldName} doesn't exist.`,
      []
    );
  }
}

function getUserCollectionInfo(user: UserRecord): string {
  const userClaims: UserClaims = user.customClaims as UserClaims;

  // Put admins in the /admins collection on company
  const tinnumberInfo = userClaims['admin'] ? `admins/${user.uid}/` : '';
  // Put other users inside a branch
  const branchInfo = !userClaims['admin']
    ? `branches/${userClaims['branch']}/users/${user.uid}/`
    : '';
  // Save super admins in the superadmin collection
  return !userClaims['superAdmin']
    ? `companies/${userClaims['tinnumber']}/${tinnumberInfo + branchInfo}`
    : 'superadmins/' + user.uid;
}

function userHasAllClaims(
  claims: UserClaims,
  customClaimsObj: UserClaims
): boolean {
  const userClaims: UserClaims = userGetClaims(customClaimsObj);
  return Object.entries(claims).every(
    ([key, val]) => userClaims[key as Claim] === val
  );
}

function userGetClaims(customClaimsObj: UserClaims): UserClaims {
  const superAdmin = !!customClaimsObj?.superAdmin;
  const admin = !!customClaimsObj?.admin;
  const manager = !!customClaimsObj?.manager;
  const tinnumber = customClaimsObj?.tinnumber;
  const branch = customClaimsObj?.branch;

  return { manager, tinnumber, superAdmin, branch, admin };
}

export const resetPassword = functions.https.onCall(async (data, context) => {
  const { email } = data;

  try {
    // Check if the user exists
    const userRecord = await admin.auth().getUserByEmail(email);

    // Generate password reset link
    const resetLink = await admin
      .auth()
      .generatePasswordResetLink(email, actionSettings);

    await db.collection('trigger_mail').add({
      to: userRecord.email,
      message: {
        subject: 'Reset your password (Melo WMS)!',
        html: generateResetPasswordEmailTemplate(
          userRecord.displayName as string,
          resetLink
        ),
      },
    });

    return { message: 'Password reset email sent successfully.' };
  } catch (error: any) {
    functions.logger.error('Error resetting password:', error);
    throw new functions.https.HttpsError(
      'internal',
      error?.message ?? 'Password reset failed.',
      error
    );
  }
});

export const verifyEmail = functions.https.onCall(async (data, context) => {
  const { email } = data;

  try {
    // Check if the user exists
    const userRecord = await admin.auth().getUserByEmail(email);

    const verificationLink = await admin
      .auth(app)
      .generateEmailVerificationLink(
        userRecord.email as string,
        actionSettings
      );
    await db.collection('trigger_mail').add({
      to: userRecord.email,
      message: {
        subject: 'Welcome to Melo WMS!',
        html: generateVerificationEmailTemplate(
          userRecord.displayName as string,
          verificationLink
        ),
      },
    });

    return { message: 'Email verification email sent successfully.' };
  } catch (error: any) {
    functions.logger.error('Error verifying email:', error);
    throw new functions.https.HttpsError(
      'internal',
      error?.message ?? 'Email verification failed.',
      error
    );
  }
});

// function userHasAnyClaims(
//   claims: UserClaims,
//   customClaimsObj: UserClaims
// ): boolean {
//   const userClaims: UserClaims = userGetClaims(customClaimsObj);
//   return Object.entries(claims).some(
//     ([key, val]) => userClaims[key as Claim] === val
//   );
// }

const styles = ` <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f1f1f1;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #2196F3;
    }
    p {
      margin-bottom: 20px;
    }
    a {
      color: #fff!important;
      font-size: 18px;
      text-decoration: none;
    }
    .btn {
      display: inline-block;
      background-color: #2196F3;
      color: #fff;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
    }
    .footer {
      margin-top: 20px;
      color: #888;
      font-size: 12px;
    }
  </style>
</head>
<body>`;

function generateVerificationEmailTemplate(
  name: string,
  verificationLink: string
): string {
  const template = `
    ${styles}
      <div class="container">
        <h2>Hello ${name}!</h2>
        <p>You have been registered in Melo WMS, please click the button below to verify your email address.</p>
        <a href="${verificationLink}" class="btn">Verify Email</a>
        <div class="footer">
          <p>If you don't know about Melo WMS, please reply to this email for support!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return template.trim();
}

function generateResetPasswordEmailTemplate(
  name: string,
  resetLink: string
): string {
  const template = `
  ${styles}
      <div class="container">
      <h2>Hello ${name}!</h2>
      <p>You have requested to reset your password, please click the button below to reset you password.</p>
        <a href="${resetLink}" class="btn">Reset Password &rarr;</a>
        <div class="footer">
          <p>If you didn't try to reset your account password, ignore this email!</p>
          <p>If you don't know about Melo WMS, please reply to this email for support!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return template.trim();
}

// export const autoSwitchBack = functions.auth
//   .user()
//   .beforeSignIn(async (user, context) => {
//     const auth = admin.auth(app);
//     const switchedFrom = user.customClaims?.switchedFrom;
//     const isSuperAdmin = switchedFrom === 'superAdmin';
//     const isAdmin = switchedFrom === 'admin';

//     const isSwitched = !!user.customClaims?.switched;

//     if ((!isSuperAdmin && !isAdmin) || !isSwitched) {
//       return;
//     }

//     if (isAdmin) {
//       await auth.setCustomUserClaims(context.auth?.uid as string, {
//         tinnumber: user.customClaims?.tinnumber,
//         branch: undefined,
//         manager: undefined,
//         admin: true,
//         switched: undefined,
//         switchedFrom: undefined,
//       });
//     } else if (isSuperAdmin) {
//       await auth.setCustomUserClaims(context.auth?.uid as string, {
//         tinnumber: undefined,
//         branch: undefined,
//         manager: undefined,
//         superAdmin: true,
//         switched: undefined,
//       });
//     }
//     return;
//   });
