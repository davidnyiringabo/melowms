import * as functions from "firebase-functions";
import { FieldValue, DocumentReference } from "firebase-admin/firestore";
import {
  RemoteConfirm,
  Customer,
  SalesState,
  Branch,
  // CollectionName,
  // Fillable,
  Order,
  Inventory,
  RemoteConfirmTransfer,
  Transfer,
  InventoryAction,
  BranchFillable,
  CustomerFinancesType,
} from "../types";
import admin, { app } from "../admin";
import { App } from "firebase-admin/app";
import { saveFillables } from "./fillables2";
// import { checkPackageAvailability } from './empties';

const db = admin.firestore(app as App);

export * from "./invoice";

export const confirmSale = functions.https.onCall(
  async (data: RemoteConfirm, context) => {
    if (!context.auth)
      throw new functions.https.HttpsError(
        "permission-denied",
        "You have insufficient permissions."
      );

    const uid = context.auth?.uid;
    try {
      return db.runTransaction(async (transaction) => {
        const cartRef = db.doc(data.cartDoc);
        const customerRef = db.doc(
          data.customerDoc
        ) as DocumentReference<Customer>;
        const customer = (
          await transaction.get(customerRef)
        ).data() as Customer;
        const inventoryRef = db.collection(
          `companies/${customer.path.companies}/branches/${customer.path.branches}/inventory`
        );
        const branchRef = db.doc(
          `companies/${customer.path.companies}/branches/${customer.path.branches}`
        );

        const cartData = (await transaction.get(cartRef)).data() as SalesState;

        const orderRef = customerRef.collection("orders").doc();
        const branchData = (await transaction.get(branchRef)).data() as Branch;

        const orderData: Order = {
          items: cartData.orderItems,
          totalItems: cartData.orderItems.length,
          totalCost: cartData.orderItemsCost,
          caution: cartData.payInfo.caution,
          empties: cartData.payInfo.empties,
          payMethod: cartData.payInfo.payMethod,
          payDate: cartData.payInfo.payDate,
          credit: cartData.payInfo.payAmount,
          totalTax: cartData.totalTax,
          uids: [uid],
          discount: cartData.payInfo.discount ?? 0,
          customer: (cartData.customer as Customer).id,
          customerName: (cartData.customer as Customer).name,
          costAfterDiscount: cartData.costAfterDiscount,
          totalQuantity: cartData.totalQuantity,
          status: "COMPLETED",
          delivery: {
            address: customer.address,
            startedAt: "",
            date: "",
            status: "UNSTARTED",
          },
          path: {
            ...customer.path,
            customers: customerRef.id,
            orders: orderRef.id,
          },
          updatedTime: FieldValue.serverTimestamp(),
          createdTime: FieldValue.serverTimestamp(),
        };

        const checkInventoryResults = await Promise.all(
          cartData.orderItems.map(async (oi) => {
            const inveRef = inventoryRef.doc(oi.item);
            const inv = (await transaction.get(inveRef)).data() as Inventory;
            if (oi.quantity > inv.quantity) {
              throw new functions.https.HttpsError(
                "unavailable",
                `Sale failed due to insufficient stock, for item "${oi.itemName}".`
              );
            }

            return [inveRef, inv.quantity, oi.quantity, oi.taxAmount];
          })
        );

        const handleWrites = await saveFillables({
          trans: transaction,
          customerRef: customerRef,
          customer: customer,
          customerPath: customer.path,
          orderItems: orderData.items,
          totalQuantity: orderData.totalQuantity,
        });

        functions.logger.log("Fillables Read....");
        // WRITES START HERE

        await handleWrites();
        functions.logger.log("Fillables Written....");

        // Add customer finance transaction
        const financeRef = customerRef
          .collection(`customer_finances`)
          .doc() as DocumentReference<Omit<CustomerFinancesType, "id">>;

        transaction.create(financeRef, {
          amount: orderData.totalCost,
          createdTime: FieldValue.serverTimestamp(),
          updatedTime: FieldValue.serverTimestamp(),
          uids: [context.auth?.uid ?? ""],
          path: {
            companies: branchRef.parent.parent?.id as string,
            branches: branchRef.id,
            customers: customerRef.id,
            customer_finances: financeRef.id,
          },
          type: "OUT",
          transDate: FieldValue.serverTimestamp(),
          _cref: financeRef.path,
        });

        checkInventoryResults.forEach(
          ([inveRef, invQuantity, orderQuantity, itemTax]) => {
            transaction.update(inveRef as DocumentReference<Inventory>, {
              quantity: (invQuantity as number) - (orderQuantity as number),
              lastChange: (orderQuantity as number) * -1,
              lastTax: itemTax,
              lastAction: InventoryAction.Sell,
            });
          }
        );
        transaction.create(orderRef, orderData);
        transaction.update(branchRef, {
          totalSales:
            (branchData.totalSales || 0) + orderData.costAfterDiscount,
        });
        transaction.delete(cartRef);
        return null;
      });
    } catch (error) {
      functions.logger.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Sale failed due to internal error, please contact support."
      );
    }
  }
);

export const confirmTransfer = functions.https.onCall(
  async (data: RemoteConfirmTransfer, context) => {
    if (!context.auth)
      throw new functions.https.HttpsError(
        "permission-denied",
        "You have insufficient permissions."
      );

    const uid = context.auth?.uid;

    return db.runTransaction(async (transaction) => {
      const cartRef = db.doc(data.cartDoc);
      const otherBranchRef = db.doc(data.receiverBranch);
      const otherBranch = (
        await transaction.get(otherBranchRef)
      ).data() as Branch;
      otherBranch.id = otherBranchRef.id;

      const ourBranchRef = db.doc(data.branch) as DocumentReference<Branch>;
      const ourInventoryRef = ourBranchRef.collection("inventory");

      if (ourBranchRef.id === otherBranchRef.id) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "You can't transfer in the same branch. Please choose another branch."
        );
      }

      const theirInvetoryRef = otherBranchRef.collection("inventory");

      const ourBranch = (await ourBranchRef.get()).data() as Branch;
      const cartData = (await transaction.get(cartRef)).data() as SalesState;

      const ourTransferRef = ourBranchRef.collection("transfers").doc();
      const theirTransferRef = otherBranchRef.collection("transfers").doc();

      const orderData: Transfer = {
        items: cartData.orderItems,
        totalItems: cartData.orderItems.length,
        totalCost: cartData.orderItemsCost,
        caution: cartData.payInfo.caution,
        empties: cartData.payInfo.empties,
        payMethod: cartData.payInfo.payMethod,
        payDate: cartData.payInfo.payDate,
        totalTax: cartData.totalTax,
        credit: cartData.payInfo.payAmount,
        uids: [uid],
        doneItems: 0,
        discount: cartData.payInfo.discount ?? 0,
        costAfterDiscount: cartData.costAfterDiscount,
        totalQuantity: cartData.totalQuantity,
        transferType: "OUT",
        toBranch: otherBranch.name,
        theirTransfer: theirTransferRef.id,
        to: otherBranchRef.id,
        from: ourBranchRef.id,
        fromBranch: ourBranch.name,
        status: "PENDING",
        delivery: {
          address: "",
          startedAt: "",
          date: "",
          status: "UNSTARTED",
        },
        path: {
          companies: otherBranch.path.companies,
          branches: ourBranchRef.id,
          transfers: ourTransferRef.id,
        },
        updatedTime: FieldValue.serverTimestamp(),
        createdTime: FieldValue.serverTimestamp(),
      };

      const checkOurInventoryResults = await Promise.all(
        cartData.orderItems.map(async (oi) => {
          const inveRef = ourInventoryRef.doc(oi.item);
          const inv = (await transaction.get(inveRef)).data() as Inventory;
          if (oi.quantity > inv.quantity) {
            throw new functions.https.HttpsError(
              "unavailable",
              `Sale failed due to insufficient stock, for item "${oi.itemName}".`
            );
          }
          const theirItemRef = theirInvetoryRef.doc(oi.item);
          const theirData = (await theirItemRef.get()).data();
          const theirQuantity = theirData ? theirData.quantity : 0;
          const exists = (await theirItemRef.get()).exists;

          return [
            inveRef,
            inv.quantity,
            oi.quantity,
            oi.taxAmount,
            exists,
            theirItemRef,
            theirQuantity,
            oi.unitPrice,
          ];
        })
      );

      const fillableRef = ourBranchRef
        .collection("branch_fillables")
        .doc(otherBranch.id) as DocumentReference<BranchFillable>;
      const handleWrites = await saveFillables({
        trans: transaction,
        customerRef: fillableRef,
        customer: otherBranch as unknown as BranchFillable,
        customerPath: ourBranch.path,
        orderItems: orderData.items,
        totalQuantity: orderData.totalQuantity,
        isBranch: true,
      });

      functions.logger.log("Fillables Read....");
      // WRITES START HERE

      await handleWrites();
      functions.logger.log("Fillables Written....");

      // WRITES START HERE

      checkOurInventoryResults.forEach(
        ([
          itemRef,
          invQuantity,
          orderQuantity,
          itemTax,
          theirItemExists,
          theirItemRef,
          theirQuantity,
          unitPrice,
        ]) => {
          transaction.update(itemRef as DocumentReference<Inventory>, {
            quantity: (invQuantity as number) - (orderQuantity as number),
            lastChange: (orderQuantity as number) * -1,
            lastTax: itemTax,
            lastAction: InventoryAction.Transfer,
          });
          // if (theirItemExists) {
          //   transaction.update(
          //     theirItemRef as DocumentReference<DocumentData>,
          //     {
          //       quantity: (theirQuantity as number) + (orderQuantity as number),
          //     }
          //   );
          // } else {
          //   transaction.create(
          //     theirItemRef as DocumentReference<DocumentData>,
          //     {
          //       quantity: orderQuantity as number,
          //       item: theirItemRef.id,
          //       path: {
          //         ...otherBranch.path,
          //         inventory: theirItemRef.id,
          //         unitPrice,
          //         branch: otherBranchRef.id,
          //         company: otherBranch.path.companies,
          //       },
          //     }
          //   );
          // }
        }
      );

      const theirTransferData = { ...orderData };
      theirTransferData.transferType = "IN";
      theirTransferData.path.branches = otherBranchRef.id;
      theirTransferData.path.transfers = theirTransferRef.id;
      theirTransferData.theirTransfer = ourTransferRef.id;

      transaction.create(ourTransferRef, { ...orderData, transferType: "OUT" });
      transaction.create(theirTransferRef, theirTransferData);

      transaction.delete(cartRef);
      return null;
    });
  }
);
