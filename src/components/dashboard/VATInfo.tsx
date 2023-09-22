import { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { StatsLevel, StatNode } from '../../helpers/statsTree';
import toRwf from '../../helpers/toRwf';

const VATInfo = () => {
  const { sTree, viewDate, isCompany } = useDashboard();
  const [isPos, setIsPos] = useState(false);
  const [mNode, setMNode] = useState(
    sTree.findStatsByDate(viewDate, StatsLevel.Month, true) as StatNode
  );

  useEffect(() => {
    setMNode(
      sTree.findStatsByDate(viewDate, StatsLevel.Month, true) as StatNode
    );
  }, [sTree, viewDate]);

  useEffect(() => {
    setIsPos(mNode.stats.sVAT - mNode.stats.pVAT > 0 ? true : false);
  }, [mNode]);

  return !isCompany ? (
    <div className="mt-2" />
  ) : (
    <div className="flex self-end bg-blue-200/60 shadow mb-3 p-1 rounded w-fit px-3 gap-4 items-center">
      <span className="font-bold font-mono">
        {viewDate.toLocaleDateString('en-rw', {
          month: 'long',
          year: 'numeric',
        })}
      </span>
      <span className="p-1">
        <span className="font-semibold text-sm  mr-2">Sold VAT: </span>
        <span className="px-2 py-1 rounded shadow-sm border bg-gray-100">
          {toRwf(mNode.stats.sVAT ?? 0)}
        </span>
      </span>
      <span className="font-semibold text-sm">Purchased VAT:</span>
      <span className="px-2 py-1 rounded shadow-sm border bg-gray-100">
        {toRwf(mNode.stats.pVAT ?? 0)}
      </span>
      <span className="font-semibold text-sm text-blue-700 mr-2">
        VAT In-hand
      </span>
      <span
        className={`px-2 py-1 rounded font-semibold text-sm shadow-sm border ${
          isPos ? 'bg-red-500 text-white' : ' bg-green-500 text-white'
        }`}
      >
        {toRwf((mNode.stats.sVAT ?? 0) - (mNode.stats.pVAT ?? 0))}
      </span>
    </div>
  );
};

export default VATInfo;
