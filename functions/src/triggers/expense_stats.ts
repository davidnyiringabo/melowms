import * as functions from 'firebase-functions';
import admin, { app } from '../admin';
import StatsTree, { ExportStats, StatsEntry } from '../statsTree';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Expense, StatsType } from '../types';
import moment = require('moment');

const db = admin.firestore(app);

export const updateExpenseStats = functions.firestore
  .document(`companies/{tinnumber}/branches/{branch}/branch_expenses/{expense}`)
  .onWrite(async (change, context) => {
    const beforeApproved =
      (change.before.data() as Expense | undefined)?.approved ?? false;
    const afterApproved =
      (change.after.data() as Expense | undefined)?.approved ?? false;

    const approved = !change.after.exists
      ? beforeApproved
      : !change.before.exists
      ? afterApproved
      : beforeApproved || afterApproved;

    if (!approved) return;

    const branchStatsRef = db.doc(
      `companies/${context.params.tinnumber}/branches/${context.params.branch}/branch_stats/stat0`
    );
    const companyStatsRef = db.doc(
      `companies/${context.params.tinnumber}/company_stats/stat0`
    );

    const branchStats = (await branchStatsRef.get()).data() as
      | StatsType
      | undefined;

    const companyStats = (await companyStatsRef.get()).data() as
      | StatsType
      | undefined;

    const expenses = !change.after.exists
      ? (change.before.data() as Expense).amount * -1
      : !change.before.exists
      ? (change.after.data() as Expense).amount
      : (beforeApproved ? (change.before.data() as Expense).amount * -1 : 0) +
        (afterApproved ? (change.after.data() as Expense).amount : 0);

    const newStats: StatsEntry = {
      sales: 0,
      stock: 0,
      purchase: 0,
      accepted: 0,
      sVAT: 0,
      pVAT: 0,
      expenses,
      transfered: 0,
      date: moment().toDate(),
    };

    functions.logger.debug({
      newStats,
    });

    const modifiedBranchStats = handleModifyStats(
      newStats,
      branchStats ?? ({ stats: new StatsTree().toObj() } as StatsType)
    );
    const modifiedCompanyStats = handleModifyStats(
      newStats,
      companyStats ?? ({ stats: new StatsTree().toObj() } as StatsType)
    );

    const branchResult: Omit<StatsType, 'path' | 'createdTime'> = {
      stats: modifiedBranchStats,
      updatedTime: FieldValue.serverTimestamp() as Timestamp,
      uids: [context.auth?.uid ?? ''],
    };

    const companyResult: Omit<StatsType, 'path' | 'createdTime'> = {
      stats: modifiedCompanyStats,
      updatedTime: FieldValue.serverTimestamp() as Timestamp,
      uids: [context.auth?.uid ?? ''],
    };

    if (branchStats) {
      await branchStatsRef.update(branchResult);
    } else {
      await branchStatsRef.create({
        ...branchResult,
        createdTime: FieldValue.serverTimestamp(),
      });
    }

    if (companyStats) {
      await companyStatsRef.update(companyResult);
    } else {
      await companyStatsRef.create({
        ...companyResult,
        createdTime: FieldValue.serverTimestamp(),
      });
    }

    return null;
  });

function handleModifyStats(
  newStats: StatsEntry,
  stats: StatsType
): ExportStats {
  if (!stats) {
    throw new functions.https.HttpsError(
      'aborted',
      'Stats to be modified are missing!'
    );
  }

  const tree = StatsTree.fromObj(stats.stats);
  tree.addStats(newStats);

  functions.logger.debug({
    tree: tree.toObj(),
  });
  return tree.toObj();
}
