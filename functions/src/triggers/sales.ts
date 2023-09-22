import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
} from 'firebase-admin/firestore';
import {
  Invoice,
  Purchase,
  Inventory,
  Branch,
  InventoryAction,
  Grant,
  GrantTrans,
} from '../types';
import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import StatsTree, { ExportStats, StatsEntry } from '../statsTree';
import moment = require('moment');

const db = admin.firestore(app);

export const updateInvoiceTotals = functions.firestore
  .document(
    'companies/{tinnumber}/branches/{branch}/suppliers/{supplier}/invoices/{invoiceId}/purchases/{purchase}'
  )
  .onWrite(async (change, context) => {
    const invoicePath = `companies/${context.params.tinnumber}/branches/${context.params.branch}/suppliers/${context.params.supplier}/invoices/${context.params.invoiceId}`;

    const invoiceRef = db.doc(invoicePath);
    const invoiceData = (await invoiceRef.get()).data() as Invoice;
    const isDelete = !change.after.exists;
    const isCreate = !change.before.exists;

    if (invoiceData.confirmed) return null;

    if (isDelete) {
      const pur = change.before.data() as Purchase;
      const canBeTaxed = pur.taxCode === 'B';

      return invoiceRef.update({
        totalItemCount: (invoiceData.totalItemCount || 1) - 1,
        totalQuantity: (invoiceData.totalQuantity ?? 0) - pur.quantity,
        totalCost: (invoiceData.totalCost || 0) - pur.total,
        totalTaxableAmount:
          (invoiceData.totalTaxableAmount || 0) - (canBeTaxed ? pur.total : 0),
        totalTaxAmount: (invoiceData.totalTaxAmount || 0) - pur.taxAmount,
      });
    } else if (isCreate) {
      const pur = change.after.data() as Purchase;
      const canBeTaxed = pur.taxCode === 'B';

      return invoiceRef.update({
        totalItemCount: (invoiceData.totalItemCount || 0) + 1,
        totalQuantity: (invoiceData.totalQuantity ?? 0) + pur.quantity,
        totalCost: (invoiceData.totalCost || 0) + pur.total,
        totalTaxableAmount:
          (invoiceData.totalTaxableAmount || 0) + (canBeTaxed ? pur.total : 0),
        totalTaxAmount: (invoiceData.totalTaxAmount || 0) + pur.taxAmount,
      });
    } else {
      const prev = change.before.data() as Purchase;
      const newPur = change.after.data() as Purchase;
      const prevInvoiceTotal = (invoiceData.totalCost || 0) - prev.total;
      const newInvoiceTotal = prevInvoiceTotal + newPur.total;

      const wasTaxed = prev.taxCode === 'B';
      const canBeTaxed = newPur.taxCode === 'B';

      return invoiceRef.update({
        totalCost: newInvoiceTotal,
        totalQuantity:
          (invoiceData.totalQuantity ?? 0) - prev.quantity + newPur.quantity,
        totalTaxableAmount:
          (invoiceData.totalTaxableAmount || 0) +
          (wasTaxed ? -1 * prev.total : 0) +
          (canBeTaxed ? newPur.total : 0),
        totalTaxAmount:
          (invoiceData.totalTaxAmount || 0) +
          -1 * prev.taxAmount +
          newPur.taxAmount,
      });
    }
  });

export const updateStock = functions.firestore
  .document(
    'companies/{tinnumber}/branches/{branch}/suppliers/{supplier}/invoices/{invoiceId}/purchases/{purchase}'
  )
  .onWrite(async (change, context) => {
    // Already confirmed
    if (change.before.exists && change.before.data()?.confirmed) return null;
    // Delete action
    if (!change.after.exists) return null;
    const data = change.after.data() as Purchase;
    if (!data.confirmed) {
      return null;
    }
    const inventoryPath = `companies/${context.params.tinnumber}/branches/${context.params.branch}/inventory/${data.items}`;
    const inventoryDoc: DocumentSnapshot<Inventory> = (await admin
      .firestore(app)
      .doc(inventoryPath)
      .get()) as DocumentSnapshot<Inventory>;

    const amountToBePaid = data.total;

    return (db.doc(inventoryPath) as DocumentReference<Inventory>).set(
      {
        ...(inventoryDoc.exists
          ? {
              quantity: (inventoryDoc.data()?.quantity || 0) + data.quantity,
              unAllocated:
                (inventoryDoc.data()?.unAllocated || 0) + data.quantity,
              updatedTime: FieldValue.serverTimestamp(),
              itemName: data.itemName,
              lastChange: amountToBePaid,
              lastAction: InventoryAction.Purchase,
              lastTax: data.taxAmount,
              nonTaxableAmount: data.nonTaxableAmount,
              taxCode: data.taxCode,
            }
          : {
              quantity: data.quantity,
              unAllocated: data.quantity,
              item: data.items,
              itemName: data.itemName,
              branch: data.path.branches,
              path: {
                companies: data.path.companies,
                branches: data.path.branches,
                inventory: data.items,
              },
              company: data.path.companies,
              unitPrice: data.sellingPrice,
              lastChange: amountToBePaid,
              lastAction: InventoryAction.Purchase,
              nonTaxableAmount: data.nonTaxableAmount,
              lastTax: data.taxAmount,
              taxCode: data.taxCode,
              updatedTime: FieldValue.serverTimestamp(),
              createdTime: FieldValue.serverTimestamp(),
            }),
      },
      { merge: true }
    );
  });

export const confirmInvoicesAndPurchases = functions.firestore
  .document(
    'companies/{tinnumber}/branches/{branch}/suppliers/{supplier}/invoices/{invoiceId}'
  )
  .onWrite(async (change, context) => {
    const batch = db.batch();

    const branchRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}`
    );
    const branchData = (await branchRef.get()).data() as Branch;

    const grantsRef = db
      .collection(`companies/${context.params.tinnumber}/grants`)
      .limit(1);

    // Delete Action
    if (!change.after.exists) {
      const invData = change.before.data() as Invoice;

      const amountToBePaid = invData.totalCost;

      if (!invData.confirmed || invData.canceled) return null;

      const grant = (await grantsRef.get()).docs[0];
      const grantData = grant?.data() as Grant;

      batch.update(branchRef, {
        totalPurchases: (branchData.totalPurchases || 0) - invData.totalCost,
      });
      batch.update<Grant>(grant.ref as DocumentReference<Grant>, {
        balance: grantData.balance - amountToBePaid,
        creditAmount: grantData.creditAmount + amountToBePaid,
      });
      return batch.commit();
    }

    const invData = change.after.data() as Invoice;
    if (!invData.confirmed || invData.saved || invData.canceled) return null;

    const amountToBePaid = invData.totalCost;

    const grant = (await grantsRef.get()).docs[0];
    const transRef = (
      grant.ref.collection('grant_transactions') as CollectionReference<
        Omit<GrantTrans, 'id'>
      >
    ).doc();

    await transRef.create({
      amount: amountToBePaid,
      type: 'IN',
      bankUsed: 'Auto Generated',
      orderBranch: context.params.branch,
      orderNumber: invData.orderNumber,
      order: context.params.invoiceId,
      transDate: invData.purchaseDate,
      path: {
        companies: context.params.tinnumber,
        grants: grant.ref.id,
        grant_transactions: transRef.id,
      },
      createdTime: FieldValue.serverTimestamp(),
      updatedTime: FieldValue.serverTimestamp(),
      _cref: transRef.path,
      bankAccount: 'Auto Generated',
      uids: [context.auth?.uid ?? ''],
    });

    const purchasesRef = change.after.ref.collection('purchases');

    // confirm all purchases where invoices field equals invoiceId
    const purchases = await purchasesRef.get();

    purchases.forEach((doc) => {
      const purchaseRef = doc.ref;
      batch.update(purchaseRef, { confirmed: true });
    });

    batch.update(branchRef, {
      totalPurchases: (branchData.totalPurchases || 0) + invData.totalCost,
    });
    // batch.update<Grant>(grant.ref as DocumentReference<Grant>, {
    //   balance: grantData.balance - amountToBePaid,
    //   creditAmount: grantData.creditAmount + amountToBePaid,
    // });
    batch.update(change.after.ref, {
      saved: true,
      savedAt: FieldValue.serverTimestamp(),
      paidAmount: 0,
    });

    return batch.commit();
  });

export const replaceInvoce = functions.firestore
  .document(
    'companies/{tinnumber}/branches/{branch}/suppliers/{supplier}/invoices/{invoiceId}'
  )
  .onCreate(async (snap, context) => {
    const data = snap.data() as Invoice;

    // Has previous invoice
    if (!(data.prevId && data.prevOrderNumber)) return;

    return db.runTransaction(async (trans) => {
      const prevInvoice = snap.ref.parent.doc(data.prevId as string);

      (
        await trans.get(db.collection(`${prevInvoice.path}/purchases`))
      ).docs.map((doc) => {
        const newPath = `${snap.ref.path}/purchases/${doc.id}`;
        const docData = doc.data();
        trans.create(db.doc(newPath), {
          ...docData,
          _cref: newPath,
          path: { ...docData.path, invoices: snap.id },
          createdTime: FieldValue.serverTimestamp(),
          updatedTime: FieldValue.serverTimestamp(),
          uids: [context.auth?.uid ?? ''],
        });
      });

      trans.update(prevInvoice, {
        replacedBy: snap.id,
        replacedOrderNumber: data.orderNumber,
        canceled: true,
        saved: true,
        savedAt: FieldValue.serverTimestamp(),
      });

      return null;
    });
  });

export const updateStats = functions.firestore
  .document('companies/{tinnumber}/branches/{branch}/inventory/{inventory}')
  .onWrite(async (change, context) => {
    return db.runTransaction(async (transaction) => {
      const isCreate = !change.before.exists;
      const isDelete = !change.after.exists;

      const getNewDate = () => {
        return moment().toDate();
      };

      let newStats: StatsEntry = {
        purchase: 0,
        date: getNewDate(),
        sales: 0,
        sVAT: 0,
        expenses: 0,
        pVAT: 0,
        stock: 0,
        accepted: 0,
        transfered: 0,
      };

      // Modify Data
      const handleModidyStats = (
        inv: Inventory,
        qtyChange: number
      ): StatsEntry => {
        const totalChange = Math.abs(qtyChange * inv.unitPrice);
        const stats: StatsEntry = {
          purchase: 0,
          date: getNewDate(),
          sales: 0,
          stock: 0,
          sVAT: 0,
          expenses: 0,
          pVAT: 0,
          accepted: 0,
          transfered: 0,
        };

        // Restock quantity - > Decrease sales stats, increase stock stats
        if (inv.lastAction === InventoryAction.Restock) {
          // stats.sales -= totalChange;
          stats.transfered -= totalChange;
          stats.stock += totalChange;
        } else if (inv.lastAction === InventoryAction.Transfer) {
          // stats.sales += totalChange;
          stats.transfered += totalChange;
          stats.stock -= totalChange;
        } else if (inv.lastAction === InventoryAction.Sell) {
          stats.sales += totalChange;
          stats.stock -= totalChange;
          stats.sVAT += inv.lastTax;
        } else if (inv.lastAction === InventoryAction.Accept) {
          // stats.purchase += totalChange;
          stats.accepted += totalChange;
          stats.stock += totalChange;
        } else if (inv.lastAction === InventoryAction.Purchase) {
          stats.purchase += inv.lastChange;
          stats.stock += totalChange;
          stats.pVAT += inv.lastTax;
        }

        return stats;
      };

      const currentInv = change.after.data() as Inventory;
      const prevInv = change.before.data() as Inventory;
      let action = null;

      if (isDelete) {
        newStats.stock -= prevInv.quantity * prevInv.unitPrice;
        action = prevInv.lastChange;
      } else if (isCreate) {
        newStats = handleModidyStats(currentInv, currentInv.quantity);
        action = currentInv.lastAction;
      } else {
        newStats = handleModidyStats(
          currentInv,
          currentInv.quantity - prevInv.quantity
        );
        if (currentInv.unitPrice !== prevInv.unitPrice) {
          newStats.stock +=
            currentInv.quantity * currentInv.unitPrice -
            prevInv.quantity * prevInv.unitPrice;
        }
        action = currentInv.lastAction;
      }

      const affectsCompany =
        action === InventoryAction.Sell || action === InventoryAction.Purchase;

      await saveBranchStats();
      await saveCompanyStats();

      async function saveBranchStats() {
        const branchStatsRef = db.doc(
          `companies/${context.params.tinnumber}/branches/${context.params.branch}/branch_stats/stat0`
        );
        const branchStatsData = (await branchStatsRef.get()).data();
        const branchStatsTree = branchStatsData?.stats
          ? StatsTree.fromObj(branchStatsData?.stats as ExportStats)
          : new StatsTree();

        newStats.date = getNewDate();
        branchStatsTree.addStats(newStats);

        const branchFinalDoc = {
          stats: branchStatsTree.toObj(),
          path: {
            companies: context.params.tinnumber,
            branches: context.params.branch,
            branch_stats: branchStatsRef.id,
          },
          updatedTime: FieldValue.serverTimestamp(),
        };

        if (branchStatsData !== undefined) {
          transaction.update(branchStatsRef, branchFinalDoc);
        } else {
          transaction.create(branchStatsRef, {
            ...branchFinalDoc,
            createdTime: FieldValue.serverTimestamp(),
          });
        }
      }

      async function saveCompanyStats() {
        if (!affectsCompany) {
          // Don't change company stock on transfers
          // Ignore for now because of re-stock damages
          // newStats.stock = 0;
        }
        const companyStatsRef = db.doc(
          `companies/${context.params.tinnumber}/company_stats/stat0`
        );
        const companyStatsData = (await companyStatsRef.get()).data();
        const companyStatsTree = companyStatsData?.stats
          ? StatsTree.fromObj(companyStatsData?.stats as ExportStats)
          : new StatsTree();
        companyStatsTree.addStats(newStats);

        const companyFinalDoc = {
          stats: companyStatsTree.toObj(),
          path: {
            companies: context.params.tinnumber,
            company_stats: companyStatsRef.id,
          },
          updatedTime: FieldValue.serverTimestamp(),
        };

        if (companyStatsData !== undefined) {
          transaction.update(companyStatsRef, { ...companyFinalDoc });
        } else {
          transaction.create(companyStatsRef, {
            ...companyFinalDoc,
            createdTime: FieldValue.serverTimestamp(),
          });
        }
      }

      return;
    });
  });

export const updateOrderNumber = functions.firestore
  .document(
    `companies/{tinnumber}/branches/{branch}/customers/{customer}/orders/{order}`
  )
  .onCreate(async (snap, context) => {
    return db.runTransaction(async (trans) => {
      const compRef = db.doc(`companies/${context.params.tinnumber}/`);
      const compData = (await trans.get(compRef)).data();

      const orderCount = (compData?.orderCount ?? 0) + 1;
      trans.update(compRef, { orderCount });
      trans.update(snap.ref, { orderCount });

      return;
    });
  });
