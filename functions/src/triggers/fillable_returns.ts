import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';
import {
  Branch,
  BranchFillable,
  Customer,
  EmptiesReturn,
  Fillable,
  Item,
  SupplierEmptiesReturn,
} from '../types';
import { updateEmptiesStock } from '../helpers';

const db = admin.firestore(app);

export const onCustomerEmptiesReturn = functions.firestore
  .document(
    `companies/{tinnumber}/branches/{branch}/customers/{customer}/empties_returns/{return_id}`
  )
  .onWrite(async (change, context) => {
    const customerRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}/customers/${context.params.customer}`
    ) as DocumentReference<Customer>;

    const itemId = (
      (change.after.exists
        ? change.after.data()
        : change.before.data()) as EmptiesReturn
    ).item;

    const itemRef = db
      .collection('items')
      .doc(itemId) as DocumentReference<Item>;

    const branchRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}`
    ) as DocumentReference<Branch>;

    const fillableRef = customerRef
      .collection(`items_taken`)
      .doc(itemId) as DocumentReference<Fillable>;
    const fillableData = (await fillableRef.get()).data() as
      | Fillable
      | undefined;
    const customerData = (await customerRef.get()).data() as Customer;

    // Delete
    if (!change.after.exists) {
      const data = change.before.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) - data.returnedQuantity,
          remaining: (fillableData?.remaining ?? 0) + data.returnedQuantity,
          updatedTime: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await customerRef.set(
        {
          totalReturned:
            (customerData.totalReturned ?? 0) - data.returnedQuantity,
          emptiesBalance:
            (customerData.emptiesBalance ?? 0) + data.returnedQuantity,
          updatedTime: FieldValue.serverTimestamp(),
        } as Partial<Customer>,
        { merge: true }
      );
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQuantity * -1,
        takenCount: 0,
      });
    } else if (!change.before.exists) {
      const data = change.after.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) + data.returnedQuantity,
          remaining: (fillableData?.remaining ?? 0) - data.returnedQuantity,
        },
        { merge: true }
      );
      await customerRef.update({
        totalReturned:
          (customerData.totalReturned ?? 0) + data.returnedQuantity,
        emptiesBalance:
          (customerData.emptiesBalance ?? 0) - data.returnedQuantity,
      });

      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQuantity,
        takenCount: 0,
      });
    } else {
      const prevData = change.before.data() as EmptiesReturn;
      const data = change.after.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) -
            prevData.returnedQuantity +
            data.returnedQuantity,
          remaining:
            (fillableData?.remaining ?? 0) +
            prevData.returnedQuantity -
            data.returnedQuantity,
        },
        { merge: true }
      );
      await customerRef.update({
        totalReturned:
          (customerData.totalReturned ?? 0) -
          (prevData.returnedQuantity + data.returnedQuantity),
        emptiesBalance:
          (customerData.emptiesBalance ?? 0) +
          (prevData.returnedQuantity - data.returnedQuantity),
      });
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        // The diff will be used inside the function
        returnedCount: data.returnedQuantity - prevData.returnedQuantity,
        takenCount: 0,
      });
    }
    return null;
  });

export const onBranchEmptiesReturn = functions.firestore
  .document(
    `companies/{tinnumber}/branches/{branch}/branch_fillables/{branch_fillable}/empties_returns/{return_id}`
  )
  .onWrite(async (change, context) => {
    const branchFillablesRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}/branch_fillables/${context.params.branch_fillable}`
    ) as DocumentReference<BranchFillable>;

    const itemId = (
      (change.after.exists
        ? change.after.data()
        : change.before.data()) as EmptiesReturn
    ).item;
    const itemRef = db
      .collection('items')
      .doc(itemId) as DocumentReference<Item>;

    const branchRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}`
    ) as DocumentReference<Branch>;

    const fillableRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}/branch_fillables/${context.params.branch_fillable}/items_taken/${itemId}`
    ) as DocumentReference<Fillable>;
    const fillableData = (await fillableRef.get()).data() as
      | Fillable
      | undefined;
    const customerData = (
      await branchFillablesRef.get()
    ).data() as BranchFillable;

    // Delete
    if (!change.after.exists) {
      const data = change.before.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) - data.returnedQuantity,
          remaining: (fillableData?.remaining ?? 0) + data.returnedQuantity,
        },
        { merge: true }
      );
      await branchFillablesRef.set(
        {
          totalReturned:
            (customerData.totalReturned ?? 0) - data.returnedQuantity,
          emptiesBalance:
            (customerData.emptiesBalance ?? 0) + data.returnedQuantity,
        },
        { merge: true }
      );
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQuantity * -1,
        takenCount: 0,
      });
    } else if (!change.before.exists) {
      const data = change.after.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) + data.returnedQuantity,
          remaining: (fillableData?.remaining ?? 0) - data.returnedQuantity,
        },
        { merge: true }
      );
      await branchFillablesRef.set(
        {
          totalReturned:
            (customerData.totalReturned ?? 0) + data.returnedQuantity,
          emptiesBalance:
            (customerData.emptiesBalance ?? 0) - data.returnedQuantity,
        },
        { merge: true }
      );
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQuantity,
        takenCount: 0,
      });
    } else {
      const prevData = change.before.data() as EmptiesReturn;
      const data = change.after.data() as EmptiesReturn;

      await fillableRef.set(
        {
          totalReturned:
            (fillableData?.totalReturned ?? 0) -
            prevData.returnedQuantity +
            data.returnedQuantity,
          remaining:
            (fillableData?.remaining ?? 0) +
            prevData.returnedQuantity -
            data.returnedQuantity,
        },
        { merge: true }
      );
      await branchFillablesRef.set(
        {
          totalReturned:
            (customerData.totalReturned ?? 0) -
            (prevData.returnedQuantity + data.returnedQuantity),
          emptiesBalance:
            (customerData.emptiesBalance ?? 0) +
            (prevData.returnedQuantity - data.returnedQuantity),
        },
        { merge: true }
      );
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        // The diff will be used inside the function
        returnedCount: data.returnedQuantity - prevData.returnedQuantity,
        takenCount: 0,
      });
    }

    return null;
  });

export const onReturnEmptiesToSupplier = functions.firestore
  .document(
    `companies/{tinnumber}/branches/{branch}/supplier_empties_returns/{supplier_return}`
  )
  .onWrite(async (change, context) => {
    const itemId = (
      (change.after.exists
        ? change.after.data()
        : change.before.data()) as SupplierEmptiesReturn
    ).item;

    const itemRef = db
      .collection('items')
      .doc(itemId) as DocumentReference<Item>;

    const branchRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}`
    ) as DocumentReference<Branch>;

    // Delete
    if (!change.after.exists) {
      const data = change.before.data() as SupplierEmptiesReturn;
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQty,
        takenCount: 0,
      });
    } else if (!change.before.exists) {
      const data = change.after.data() as SupplierEmptiesReturn;
      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        returnedCount: data.returnedQty * -1,
        takenCount: 0,
      });
    } else {
      const data = change.before.data() as SupplierEmptiesReturn;
      const prevData = change.before.data() as SupplierEmptiesReturn;

      await updateEmptiesStock({
        itemRef,
        branchPath: {
          companies: context.params.tinnumber,
          branches: context.params.branch,
        },
        branchRef,
        // The diff will be used inside the function
        returnedCount: prevData.returnedQty - data.returnedQty,
        takenCount: 0,
      });
    }
  });
