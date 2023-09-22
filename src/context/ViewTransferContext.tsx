import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  InventoryAction,
  Inventory as InventoryType,
  ItemRejectReason,
  OrderStatus,
  Transfer,
  TransferItem,
  TransferItemReject,
} from '../types';
import withAuthorization from '../components/hocs/withAuthorization';
import { useCustomAuth } from './Auth';
import {
  Branches,
  Companies,
  DamagedProducts,
  DocNode,
  Inventory,
  Transfers,
} from '../database';
import { useFirestore, useFirestoreDocData } from 'reactfire';
import { DocumentReference, doc, runTransaction } from 'firebase/firestore';

type ViewTransferCtx = {
  isIn: boolean;
  acceptQuantity: (item: TransferItem, quantity: number) => Promise<void>;
  rejectQuantity: (
    item: TransferItem,
    rejected: TransferItemReject
  ) => Promise<void>;
  restockQuantity: (
    item: TransferItem,
    quantity: number,
    indexes: number[]
  ) => Promise<void>;
  transfer: Transfer;
};

const viewTransferContext = React.createContext<ViewTransferCtx>({
  transfer: {} as any,
  isIn: false,
  acceptQuantity: async function (
    item: TransferItem,
    quantity: number
  ): Promise<void> {},
  rejectQuantity: async function (
    item: TransferItem,
    rejected: TransferItemReject
  ): Promise<void> {},
  restockQuantity: async function (
    item: TransferItem,
    quantity: number,
    indexes: number[]
  ): Promise<void> {},
});

export type ViewTransferProps = {
  transfer: Transfer;
};

export const useViewTransfer = () => React.useContext(viewTransferContext);

function ViewTransferProvider({
  transfer: init,
  children,
}: PropsWithChildren<ViewTransferProps>) {
  const [transfer, setTransfer] = useState(init);
  const { Branch, tinnumber, reloadTransferCount } = useCustomAuth();
  const [isIn, setIsIn] = useState(true);
  const ourTDoc = (Branch as DocNode).sub(Transfers).doc(transfer.id);

  const firestore = useFirestore();

  const { data: initialTransfer, status } = useFirestoreDocData(ourTDoc.ref, {
    idField: 'id',
  });

  useEffect(() => {
    reloadTransferCount();
    return reloadTransferCount;
  });

  useEffect(() => {
    if (!initialTransfer) return;
    setTransfer(initialTransfer as Transfer);
  }, [initialTransfer]);

  useEffect(() => {
    setIsIn(transfer.transferType !== 'OUT');
  }, [init, transfer]);

  const getTheirTDoc = useCallback(() => {
    return Companies.doc(tinnumber as string)
      .sub(Branches)
      .doc(isIn ? transfer.from : transfer.to)
      .sub(Transfers)
      .doc(transfer.theirTransfer);
  }, [transfer, isIn, init]);

  const acceptQuantity = async (item: TransferItem, quantity: number) => {
    return runTransaction(firestore, async (trans) => {
      const theirTDoc = getTheirTDoc();
      const newItem: TransferItem = { ...item };
      newItem.acceptedQty = (newItem.acceptedQty ?? 0) + quantity;
      newItem.isAccepted = newItem.acceptedQty === newItem.quantity;
      newItem.untouchedQty =
        newItem.quantity -
        ((newItem.acceptedQty ?? 0) + (newItem.totRejected ?? 0));

      const newItems = transfer.items.map((it) => {
        if (it.item === newItem.item) return newItem;
        return it;
      });

      const theirTData = (await trans.get(theirTDoc.ref)).data() as Transfer;
      const newDoneItems = newItem.isAccepted
        ? transfer.doneItems + 1
        : transfer.doneItems;
      const isComplete = newDoneItems === newItems.length;

      // Inventory update preparation
      const invDoc = (Branch as DocNode).sub(Inventory).doc(item.item);
      const invSnapshot = await trans.get(invDoc.ref);
      const inventoryExists = invSnapshot.exists();
      const invData = invSnapshot.data() as InventoryType;

      // Update Transfer
      trans.update(ourTDoc.ref, {
        ...transfer,
        doneItems: newDoneItems,
        status: isComplete ? 'COMPLETED' : transfer.status,
        items: newItems,
      } as Transfer);

      trans.update(theirTDoc.ref, {
        ...theirTData,
        doneItems: newDoneItems,
        status: isComplete ? 'COMPLETED' : transfer.status,
        items: newItems,
      });

      // Update stock
      if (inventoryExists) {
        trans.update(invDoc.ref, {
          quantity: invData.quantity + quantity,
          unAllocated: (invData.unAllocated ?? 0) + quantity,
          lastAction: InventoryAction.Accept,
          lastChange: quantity,
          itemName: newItem.itemName,
          taxCode: item.taxCode,
        });
      } else {
        trans.set<Omit<InventoryType, 'id' | 'path'>>(
          invDoc.ref as DocumentReference<Omit<InventoryType, 'id' | 'path'>>,
          {
            item: item.item,
            unitPrice: item.unitPrice,
            quantity: quantity,
            branch: Branch?.id as string,
            company: tinnumber as string,
            unAllocated: quantity,
            lastAction: InventoryAction.Accept,
            lastChange: quantity,
            lastTax: 0,
            taxCode: item.taxCode,
            itemName: newItem.itemName,
            nonTaxableAmount: item.nonTaxableAmount ?? 0,
          }
        );
      }
      return;
    });
  };

  const rejectQuantity = async (
    item: TransferItem,
    rejected: TransferItemReject
  ) => {
    return runTransaction(firestore, async (trans) => {
      const theirTDoc = getTheirTDoc();

      const newItem = { ...item };
      if (!newItem.rejected) {
        newItem.rejected = [rejected];
      } else {
        newItem.rejected.push(rejected);
      }

      const totRejected: number = newItem.rejected.reduce(
        (ac, c) => ac + c.qty,
        0
      );

      newItem.totRejected = totRejected;
      newItem.isRejected = newItem.quantity === totRejected;

      newItem.untouchedQty =
        newItem.quantity -
        ((newItem.acceptedQty ?? 0) + (newItem.totRejected ?? 0));

      const newItems = transfer.items.map((it) => {
        if (it.item === newItem.item) return newItem;
        return it;
      });

      const theirTData = (await trans.get(theirTDoc.ref)).data() as Transfer;

      trans.update(ourTDoc.ref, { ...transfer, items: newItems });
      trans.update(theirTDoc.ref, { ...theirTData, items: newItems });
      return;
    });
  };

  const restockQuantity = async (
    item: TransferItem,
    quantity: number,
    indexes: number[]
  ) => {
    return runTransaction(firestore, async (trans) => {
      const theirTDoc = getTheirTDoc();
      const invDoc = (Branch as DocNode).sub(Inventory).doc(item.item);

      // Damaged Items
      const damages = (item.rejected as TransferItemReject[]).filter(
        (rj, i) => rj.reason === ItemRejectReason.Damaged && indexes.includes(i)
      );
      const damagedQuantity = damages.reduce((acc, curr) => acc + curr.qty, 0);

      const newItem: TransferItem = { ...item };
      newItem.rejected = (item.rejected as TransferItemReject[]).filter(
        (rj, i) => !indexes.includes(i)
      );

      newItem.totRejected = newItem.rejected.reduce((p, a) => p + a.qty, 0);
      newItem.isRejected = newItem.totRejected === item.quantity;

      newItem.quantity = newItem.quantity - quantity;
      newItem.totalPrice = newItem.quantity * newItem.unitPrice;
      newItem.totalAfterDiscount =
        newItem.totalPrice - newItem.totalPrice * newItem.discount;
      newItem.untouchedQty =
        newItem.quantity -
        ((newItem.acceptedQty ?? 0) + (newItem.totRejected ?? 0));
      newItem.isAccepted = (newItem.acceptedQty ?? 0) === newItem.quantity;

      const shouldBeRemoved = item.quantity === quantity;

      const theirTData = (await trans.get(theirTDoc.ref)).data() as Transfer;
      let newItems: TransferItem[] = [];
      const tsData: Transfer = { ...transfer };
      if (!shouldBeRemoved) {
        tsData.totalQuantity -= quantity;
        newItems = transfer.items.map((it) =>
          it.item === newItem.item ? newItem : it
        );
      } else {
        tsData.totalQuantity -= item.quantity;
        tsData.totalItems -= 1;
        newItems = transfer.items.filter((it) => it.item !== newItem.item);
      }

      const itemsAfterDiscount = newItems.reduce(
        (acc, c) => acc + c.totalAfterDiscount,
        0
      );

      tsData.totalCost = Number(
        newItems.reduce((acc, c) => acc + c.totalPrice, 0).toFixed(2)
      );
      tsData.costAfterDiscount =
        itemsAfterDiscount -
        Number(
          ((itemsAfterDiscount * (transfer.discount ?? 0)) / 100).toFixed(2)
        );

      const newDoneItems =
        !shouldBeRemoved && newItem.isAccepted
          ? transfer.doneItems + 1
          : transfer.doneItems;
      const isComplete = newDoneItems === newItems.length;

      const ourData: Transfer = {
        ...transfer,
        items: newItems,
        doneItems: newDoneItems,
        status: (isComplete ? 'COMPLETED' : transfer.status) as OrderStatus,
        totalItems: tsData.totalItems,
        totalCost: tsData.totalCost,
        costAfterDiscount: tsData.costAfterDiscount,
      };

      const theirData: Transfer = {
        ...theirTData,
        items: newItems,
        doneItems: newDoneItems,
        status: (isComplete ? 'COMPLETED' : transfer.status) as OrderStatus,
        totalItems: tsData.totalItems,
        totalCost: tsData.totalCost,
        costAfterDiscount: tsData.costAfterDiscount,
      };

      // Stock update preparation
      const invData = (await trans.get(invDoc.ref)).data() as InventoryType;

      // Update transfers
      trans.update(theirTDoc.ref, theirData);
      trans.update(ourTDoc.ref, ourData);

      // Update stock
      trans.update(invDoc.ref, {
        quantity: invData.quantity + (quantity - damagedQuantity),
        lastChange: quantity - damagedQuantity,
        lastAction: InventoryAction.Restock,
        unAllocated: (invData.unAllocated ?? 0) + (quantity - damagedQuantity),
      });

      // Save damages
      const damagesCol = (Branch as DocNode).sub(DamagedProducts);
      const newDoc = doc(damagesCol.ref);

      if (damagedQuantity < 1) return;

      trans.set(newDoc, {
        action: 'Transfer',
        toBranch: ourData.toBranch,
        to: ourData.to,
        quantity: damagedQuantity,
        items: damages,
        transfer: ourTDoc.id,
        item: item.item,
        itemName: item.itemName,
      });

      return;
    });
  };

  return (
    <viewTransferContext.Provider
      value={{
        acceptQuantity,
        rejectQuantity,
        restockQuantity,
        isIn,
        transfer,
      }}
    >
      {children}
    </viewTransferContext.Provider>
  );
}

export default withAuthorization({
  requiredClaims: { manager: true, superAdmin: false },
  all: false,
})(ViewTransferProvider);
