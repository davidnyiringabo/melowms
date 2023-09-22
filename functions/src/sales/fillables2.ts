import {
  DocumentReference,
  FieldValue,
  Transaction,
} from 'firebase-admin/firestore';
import { BranchFillable, Customer, Fillable, OrderItem } from '../types';

export async function saveFillables({
  trans,
  customerRef,
  orderItems,
  totalQuantity,
  customer,
  customerPath,
  isBranch = false,
}: {
  trans: Transaction;
  customer: Customer | BranchFillable;
  customerRef: DocumentReference<Customer | BranchFillable>;
  orderItems: OrderItem[];
  totalQuantity: number;
  customerPath: { [k: string]: string };
  isBranch?: boolean;
}) {
  const updateActions: Function[] = [];

  for (const oi of orderItems) {
    const fillableRef = customerRef
      .collection('items_taken')
      .doc(oi.item) as DocumentReference<Fillable>;
    const fillable = await trans.get(fillableRef);

    if (fillable.exists) {
      const data = fillable.data();
      updateActions.push(async () => {
        trans.update<Fillable>(fillableRef, {
          item: oi.item,
          itemName: oi.itemName,
          remaining: (data?.remaining ?? 0) + oi.quantity,
          totalTaken: (data?.totalTaken ?? 0) + oi.quantity,
          path: {
            ...customerPath,
            ...(isBranch ? { branch_fillables: customer.id } : {}),
            items_taken: oi.item,
          },
          updatedTime: FieldValue.serverTimestamp(),
          unitPrice: oi.unitPrice,
        });
      });
    } else {
      updateActions.push(async () => {
        trans.create<Fillable>(fillableRef, {
          item: oi.item,
          itemName: oi.itemName,
          remaining: oi.quantity,
          totalTaken: oi.quantity,
          unitPrice: oi.unitPrice,
          totalReturned: 0,
          path: {
            ...customerPath,
            ...(isBranch ? { branch_fillables: customer.id } : {}),
            items_taken: oi.item,
          },
          id: oi.item,
          updatedTime: FieldValue.serverTimestamp(),
          createdTime: FieldValue.serverTimestamp(),
        });
      });
    }
  }
  updateActions.push(async () => {
    trans.update(customerRef, {
      totalTaken: (customer.totalTaken ?? 0) + totalQuantity,
      emptiesBalance: (customer.emptiesBalance ?? 0) + totalQuantity,
    });
  });

  return async () => {
    await Promise.all(updateActions.map((cb) => cb()));
  };
}
