import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Company } from '../types';

const db = admin.firestore(app);

export const onCreateCompany = functions.firestore
  .document('companies/{tinnumber}')
  .onCreate(async (snap, context) => {
    const company = snap.data() as Company;
    const docRef = admin
      .firestore(app)
      .collection('companies')
      .doc(company.tinnumber.toString())
      .collection('branches')
      .doc();
    await docRef.set({
      name: 'Main Branch',
      isMain: true,
      company: company.tinnumber.toString(),
      path: { companies: company.tinnumber.toString(), branches: docRef.id },
      updatedTime: FieldValue.serverTimestamp(),
      createdTime: FieldValue.serverTimestamp(),
    });
  });

export const onBranchCreate = functions.firestore
  .document('companies/{tinnumber}/branches/{branch}')
  .onCreate(async (snap, context) => {
    const customersRef = db.collection(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}/customers/`
    );
    const docRef = customersRef.doc();
    await docRef.create({
      name: 'Anonymous',
      email: 'anonymous@wms.com',
      address: 'Unknown',
      phone: 'Unknown',
      tinnumber: 'Unknown',
      path: {
        companies: context.params.tinnumber,
        branches: context.params.branch,
        customers: docRef.id,
      },
    });
  });
