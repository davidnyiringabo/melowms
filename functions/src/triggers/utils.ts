import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore(app);

export const deleteAndMoveToDeleted = functions.firestore
  .document('{originalCollection}/{docId}')
  .onDelete(async (snap, context) => {
    const originalCollection = context.params.originalCollection;
    if (originalCollection.endsWith('_deleted')) return null;
    const docId = context.params.docId;

    const deletedCollection = `${originalCollection}_deleted`;

    const deletedDoc = snap.data();
    await admin
      .firestore()
      .collection(deletedCollection)
      .doc(docId)
      .set({ ...deletedDoc, deletedTime: FieldValue.serverTimestamp() });
    return db.collection(originalCollection).doc(docId).delete();
  });

export const generatePermissions = functions.https.onCall(
  async (data, context) => {
    const isSuperAdmin = !!context.auth?.token?.superAdmin;
    if (!isSuperAdmin)
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are not allowed to perform this action.'
      );

    const allCollections = await db.listCollections();
    // functions.logger.debug(allCollections.map(coll => {}));

    const permissions: Array<String> = [];
    allCollections.forEach((collection) => {
      const collectionName = collection.id;
      const permissionTypes = [
        'read',
        'write',
        'get',
        'list',
        'delete',
        'update',
        'give',
        'all',
      ];

      permissionTypes.forEach((perm) => [
        `${collectionName}_${perm}`,
        `${collectionName}_give_${perm}`,
      ]);
    });

    const collectionRef = admin.firestore(app).collection(`permissions`);

    return await collectionRef.doc('perms0').set({ permissions });
  }
);
