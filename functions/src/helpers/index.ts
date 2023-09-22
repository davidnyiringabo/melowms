import { DocumentReference, FieldValue } from 'firebase-admin/firestore';
import { Item, Branch, ItemEmpties } from '../types';

// Update the empties stock -- reduce/increase
export async function updateEmptiesStock({
  itemRef,
  branchRef,
  branchPath,
  returnedCount,
  takenCount,
}: {
  itemRef: DocumentReference<Item>;
  branchRef: DocumentReference<Branch>;
  branchPath: { companies: string; branches: string };
  returnedCount: number;
  takenCount: number;
}) {
  const itemEmptiesRef = branchRef
    .collection('empties_stock')
    .doc(itemRef.id) as DocumentReference<ItemEmpties>;
  const itemEmptiesSnap = itemEmptiesRef.get();
  const itemData = (await itemRef.get()).data();
  if ((await itemEmptiesSnap).exists) {
    const itemEmptiesData = (await itemEmptiesSnap).data();
    await itemEmptiesRef.set(
      {
        _cref: itemEmptiesRef.path,
        itemName: (itemData as Item).name,
        path: { ...branchPath, empties_stock: itemRef.id },
        createdTime: FieldValue.serverTimestamp(),
        updatedTime: FieldValue.serverTimestamp(),
        available: (itemEmptiesData?.available ?? 0) + returnedCount,
        totalReturned: (itemEmptiesData?.totalReturned ?? 0) + returnedCount,
        totalTaken: (itemEmptiesData?.totalTaken ?? 0) + takenCount,
      },
      { merge: true }
    );
  } else {
    await itemEmptiesRef.set({
      _cref: itemEmptiesRef.path,
      itemName: (itemData as Item).name,
      path: { ...branchPath, empties_stock: itemRef.id },
      createdTime: FieldValue.serverTimestamp(),
      updatedTime: FieldValue.serverTimestamp(),
      available: returnedCount,
      totalReturned: returnedCount,
      totalTaken: takenCount,
    });
  }

  return null;
}
