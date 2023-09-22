import { query, collectionGroup, where } from 'firebase/firestore';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { useCustomAuth } from '../../context/Auth';
import { useDashboard } from '../../context/DashboardContext';
import { Branches } from '../../database';
import { EntryType } from '../../helpers/statsTree';
import { Branch } from '../../types';
import Spinner from '../Spinner';
import BranchStatsComponent from './BranchStatsComponent';
import StatsConfig from './StatsConfig';

export default function BranchReports() {
  const { tinnumber } = useCustomAuth();
  const { statType } = useDashboard();

  const branchQuery = query(
    collectionGroup(useFirestore(), Branches.name),
    where('path.companies', '==', tinnumber)
  );
  const { data, status } = useFirestoreCollectionData(branchQuery, {
    idField: 'id',
  });

  return (
    <div className="">
      {status === 'loading' && <Spinner />}
      {data && (
        <div className="flex flex-col gap-2 w-full">
          <StatsConfig />
          <div className="flex items-center gap-3">
            <span className="flex flex-1 text-blue-400 rounded p-2  font-bold gap-2">
              Branches
            </span>
            {status === 'loading' && <Spinner />}
            {data && (
              <>
                {([statType] as EntryType[]).map((key) => (
                  <div
                    key={key}
                    className="flex border-b flex-wrap p-2 flex-1 text-sm flex-col gap-1"
                  >
                    <span className="text-xs font-bold mb-2 text-blue-600 pb-2 text-center capitalize">
                      {key}
                    </span>
                    <span className="font-bold text-center font-mono"></span>
                  </div>
                ))}
                {([statType] as EntryType[]).map((key) => (
                  <div
                    key={key}
                    className="flex border-b flex-wrap p-2 flex-1 text-sm flex-col gap-1"
                  >
                    <span className="text-xs font-bold mb-2 text-blue-600 pb-2 text-center capitalize">
                      Total {key}
                    </span>
                    <span className="font-bold text-center font-mono"></span>
                  </div>
                ))}
              </>
            )}
          </div>
          {data.map((branch) => (
            <BranchStatsComponent branch={branch as Branch} key={branch.id} />
          ))}
        </div>
      )}
    </div>
  );
}
