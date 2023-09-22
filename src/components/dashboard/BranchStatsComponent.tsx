import { useState, useEffect } from 'react';
import { useFirestoreDocData } from 'reactfire';
import { useCustomAuth } from '../../context/Auth';
import { useDashboard } from '../../context/DashboardContext';
import { useModalContext } from '../../context/ModalContext';
import { Companies, Branches, BranchStats } from '../../database';
import StatsTree, { StatNode, EntryType } from '../../helpers/statsTree';
import toRwf from '../../helpers/toRwf';
import { Branch } from '../../types';
import Modal from '../Modal';
import Spinner from '../Spinner';
import BranchInventory from './BranchInventory';
import BranchPurchases from './BranchPurchases';
import BranchSales from './BranchSales';
import BranchExpenses from './BranchExpenses';
import BranchTransfers from './BranchTransfers';

export default function BranchStatsComponent({ branch }: { branch: Branch }) {
  const { tinnumber } = useCustomAuth();
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const { viewDate, statType, viewType } = useDashboard();
  const { changeTitle, changeSize } = useModalContext();
  const statsQuery = Companies.doc(tinnumber as string)
    .sub(Branches)
    .doc(branch.id)
    .sub(BranchStats)
    .doc('stat0');

  const { data, status } = useFirestoreDocData(statsQuery.ref, {
    idField: 'id',
  });

  const [statsTree, setStatsTree] = useState(
    !data ? new StatsTree() : StatsTree.fromObj(data.stats || data)
  );
  const [statsNode, setStatsNode] = useState(
    statsTree.findStatsByDate(viewDate, viewType, true) as StatNode
  );

  useEffect(() => {
    setStatsTree(
      !data ? new StatsTree() : StatsTree.fromObj(data.stats || data)
    );
  }, [data]);

  useEffect(() => {
    setStatsNode(
      statsTree.findStatsByDate(viewDate, viewType, true) as StatNode
    );
  }, [statsTree, viewDate, viewType]);
  useEffect(() => {
    changeSize('lg');
    changeTitle(`Branch Reports - (${branch.name})`);
  }, []);

  useEffect(() => {
    if (open && !opened) setOpened(true);
  }, [open]);

  return (
    <div className="flex flex-col">
      <Modal
        open={open}
        title={`Branch ${statType} - (${branch.name})`}
        onClose={() => setOpen(false)}
      >
        {opened && statType === 'stock' && <BranchInventory branch={branch} />}
        {opened && statType === 'sales' && <BranchSales branch={branch} />}
        {opened && statType === 'purchase' && (
          <BranchPurchases branch={branch} />
        )}
        {opened && statType === 'expenses' && (
          <BranchExpenses branch={branch} />
        )}
        {opened && statType === 'accepted' && (
          <BranchTransfers transferType="IN" branch={branch} />
        )}
        {opened && statType === 'transfered' && (
          <BranchTransfers transferType="OUT" branch={branch} />
        )}
      </Modal>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 text-blue-600 rounded hover:bg-blue-300/30 p-2  font-bold gap-2"
        >
          {branch.name}
        </button>
        {status === 'loading' && <Spinner />}
        {data && (
          <>
            {([statType] as EntryType[]).map((key) => (
              <div
                key={key}
                className="flex border-b flex-wrap p-2 flex-1 text-sm flex-col gap-1"
              >
                {/* <span className="text-xs font-bold mb-2 text-blue-600 border-b pb-2 text-center capitalize">
                    {key}
                  </span> */}
                <span className="font-bold text-center font-mono">
                  {' '}
                  {toRwf(statsNode.stats[key])}
                </span>
              </div>
            ))}
            {([statType] as EntryType[]).map((key) => (
              <div
                key={key}
                className="flex border-b flex-wrap p-2 flex-1 text-sm flex-col gap-1"
              >
                {/* <span className="text-xs font-bold mb-2 text-blue-600 border-b pb-2 text-center capitalize">
                    Total {key}
                  </span> */}
                <span className="font-bold text-center font-mono">
                  {' '}
                  {toRwf(statsTree.rootStats[key])}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
