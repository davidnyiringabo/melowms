interface Item {
  id: string;
  itemName: string;
  quantity: number;
}

interface Group {
  id: string;
  groupName: string;
  items: string[]; // Array of product IDs in the group
}

interface CustomerGroup {
  id: string; // ID of the group this document is for
  allowedNow: number; // Number of packages customer is currently allowed to take
  provided: number; // Number of packages customer has remaining
}

type CheckInfo = {
  customerId: string;
  items: Item[];
  branch: string;
  isBranch: boolean;
  company: string;
};

import * as functions from 'firebase-functions';
import { DocumentReference, Transaction } from 'firebase-admin/firestore';

import admin, { app } from '../admin';

const db = admin.firestore(app);

export const checkPackageAvailability = async (
  trans: Transaction,
  data: CheckInfo
): Promise<() => void> => {
  const { company, isBranch, branch, customerId, items }: CheckInfo = data;
  const fillableGroups: Group[] = [];
  const customerGroups: CustomerGroup[] = [];

  // Retrieve customer's groups and check package availability
  const customerRef = db.doc(
    `companies/${company}/branches/${branch}${
      isBranch ? '' : `/customers/${customerId}`
    }`
  );

  const customerGroupsRef = customerRef.collection(
    isBranch ? 'branch_fillables' : 'customer_empties'
  );

  const updateActions: [
    DocumentReference,
    { allowedNow: number; provided: number }
  ][] = [];

  for (const item of items) {
    const fillableGroupRef = db.collection(
      `companies/${company}/branches/${branch}/fillable_groups`
    );

    let itemGroup = fillableGroups.find((gp) =>
      gp.items.some((it) => it === item.id)
    );

    if (!itemGroup) {
      const fillableGroupQuery = fillableGroupRef.where(
        'items',
        'array-contains',
        item.id
      );

      const itemGroupData = await trans
        .get(fillableGroupQuery)
        .then((snap) =>
          snap.docs.map(
            (doc) => ({ ...(doc.data() ?? {}), id: doc.id } as Group)
          )
        );

      itemGroup = itemGroupData[0] as Group;
      functions.logger.log({
        itemGroup,
        itemGroupData,
        item,
        fillableGroups,
      });
      if (!itemGroup) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `The item "${item.itemName}" doesn't belong to any fillable group. Change it in settings.`
        );
      }
      fillableGroups.push(...itemGroupData);
    }

    let customerGroup = customerGroups.find(
      (gp) => gp.id === (itemGroup as Group).id
    );

    const customerGroupRef = customerGroupsRef.doc(itemGroup.id);
    if (!customerGroup) {
      const cData = (await trans.get(customerGroupRef)).data();
      customerGroup = cData
        ? {
            ...(cData as CustomerGroup),
            id: customerGroupRef.id,
          }
        : undefined;

      if (!customerGroup) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `${isBranch ? 'Branch' : 'Customer'}'s fillables for group "${
            itemGroup.groupName
          }" are not configured.`
        );
      }
      customerGroups.push(customerGroup);
    }

    if (customerGroup.allowedNow < item.quantity) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `${isBranch ? 'Branch' : 'Customer'} can only take "${
          customerGroup.allowedNow
        }" quantity of "${item.itemName}" now.`
      );
    }

    const idx = customerGroups.findIndex(
      (grp) => grp.id === (customerGroup as CustomerGroup).id
    );

    customerGroups[idx].allowedNow -= item.quantity;
    customerGroups[idx].provided += item.quantity;
    updateActions.push([
      customerGroupRef,
      {
        allowedNow: customerGroups[idx].allowedNow,
        provided: customerGroups[idx].provided,
      },
    ]);
  }

  return () => {
    functions.logger.debug({ updateActions });
    updateActions.forEach(([ref, data]) => trans.update(ref, data));
  };
};
