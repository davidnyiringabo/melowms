import * as functions from 'firebase-functions';
import { Customer, CustomerFinancesType } from '../types';
import { DocumentReference } from 'firebase-admin/firestore';

export const updateCustomerFinances = functions.firestore
  .document(
    `companies/{tinnumber}/branches/{branch}/customers/{customer}/customer_finances/{customer_finance}`
  )
  .onWrite(async (change, context) => {
    const customerRef = (
      change.before.exists
        ? change.before.ref.parent.parent
        : change.after.ref.parent.parent
    ) as DocumentReference<Customer>;
    const customerData = (await customerRef.get()).data() as Customer;

    // Delete
    if (!change.after.exists) {
      const finData = change.before.data() as CustomerFinancesType;
      const dir = finData.type === 'IN' ? 1 : -1;

      await customerRef.update({
        totalCredit: (customerData.totalCredit ?? 0) - finData.amount * dir,
        totalDebit: (customerData.totalDebit ?? 0) + finData.amount * dir,
      });
    } else if (!change.before.exists) {
      const finData = change.after.data() as CustomerFinancesType;
      const dir = finData.type === 'IN' ? 1 : -1;

      await customerRef.update({
        totalCredit: (customerData.totalCredit ?? 0) + finData.amount * dir,
        totalDebit: (customerData.totalDebit ?? 0) - finData.amount * dir,
      });
    } else {
      const prevFinData = change.before.data() as CustomerFinancesType;
      const finData = change.after.data() as CustomerFinancesType;
      const dir = finData.type === 'IN' ? 1 : -1;
      const prevDir = prevFinData.type === 'IN' ? 1 : -1;

      const prevChange = prevFinData.amount * prevDir;

      const result = {
        totalCredit:
          (customerData.totalCredit ?? 0) - prevChange + finData.amount * dir,
        totalDebit:
          (customerData.totalDebit ?? 0) + prevChange - finData.amount * dir,
      };

      await customerRef.update(result);
    }
  });
