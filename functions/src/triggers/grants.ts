import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';
import { Grant, GrantTrans, Invoice } from '../types';

const db = admin.firestore(app);

export const updateGrants = functions.firestore
  .document(
    'companies/{tinnumber}/grants/{grant}/grant_transactions/{grant_trans}'
  )
  .onWrite(async (snap, context) => {
    const prev = snap.before.data() as GrantTrans | undefined;
    const current = snap.after.data() as GrantTrans | undefined;

    const grantRef = db.doc(
      `companies/${context.params.tinnumber}/grants/${context.params.grant}`
    );
    const grantData = (await grantRef.get()).data() as Grant;

    const updateInvoice = async ({
      branchId,
      supplierId,
      orderId,
      paidAmount,
    }: {
      branchId: string;
      supplierId: string;
      orderId: string;
      paidAmount: number;
    }) => {
      const invoiceRef = db.doc(
        `companies/${context.params.tinnumber}/branches/${branchId}/suppliers/${supplierId}/invoices/${orderId}`
      ) as DocumentReference<Invoice>;
      const invData = (await invoiceRef.get()).data();
      return invoiceRef.update({
        paidAmount: (invData?.paidAmount ?? 0) + paidAmount,
      });
    };

    // create
    if (!prev && current) {
      const dir = current.type === 'IN' ? 1 : -1;
      const newCreditAmount = grantData.creditAmount + current.amount * dir;
      const newBalance = grantData.balance - current.amount * dir;

      if (
        newBalance > grantData.totalAmount ||
        newCreditAmount > grantData.totalAmount
      ) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Balance or credit amount exceeds total amount.'
        );
      }

      await grantRef.update({
        creditAmount: newCreditAmount,
        balance: newBalance,
        updateTime: FieldValue.serverTimestamp(),
      });
      if (current.type === 'OUT') {
        await updateInvoice({
          branchId: current.orderBranch,
          supplierId: grantData.supplier,
          orderId: current.order,
          paidAmount: current.amount,
        });
      }

      // delete
    } else if (!current && prev) {
      const dir = prev.type === 'IN' ? -1 : 1;
      const newCreditAmount = grantData.creditAmount + prev.amount * dir;
      const newBalance = grantData.balance - prev.amount * dir;

      await grantRef.update({
        creditAmount: newCreditAmount,
        balance: newBalance,
        updateTime: FieldValue.serverTimestamp(),
      });

      if (prev.type === 'OUT') {
        await updateInvoice({
          branchId: prev.orderBranch,
          supplierId: grantData.supplier,
          orderId: prev.order,
          paidAmount: prev.amount * -1,
        });
      }
    } else if (current && prev) {
      const prevDir = prev.type === 'IN' ? -1 : 1;
      const dir = current.type === 'IN' ? 1 : -1;

      let newCreditAmount = grantData.creditAmount + prev.amount * prevDir;
      let newBalance = grantData.balance - prev.amount * prevDir;

      newCreditAmount += current.amount * dir;
      newBalance -= current.amount * dir;

      if (
        newBalance > grantData.totalAmount ||
        newCreditAmount > grantData.totalAmount
      ) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Balance or credit amount exceeds total amount.'
        );
      }

      await grantRef.update({
        creditAmount: newCreditAmount,
        balance: newBalance,
        updateTime: FieldValue.serverTimestamp(),
      });

      // Reverse prev invoice changes
      if (prev.type === 'OUT') {
        await updateInvoice({
          branchId: prev.orderBranch,
          supplierId: grantData.supplier,
          orderId: prev.order,
          paidAmount: prev.amount * -1,
        });
      }

      // Apply new invoice changes
      if (current.type === 'OUT') {
        await updateInvoice({
          branchId: current.orderBranch,
          supplierId: grantData.supplier,
          orderId: current.order,
          paidAmount: current.amount,
        });
      }
    }
    return null;
  });
