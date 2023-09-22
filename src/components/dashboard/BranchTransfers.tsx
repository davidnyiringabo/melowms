import React, { useEffect, useState } from 'react';
import { Branch, Transfer } from '../../types';
import ViewTransferContext from '../../context/ViewTransferContext';
import { Branches, Companies, DocNode, Transfers } from '../../database';
import Table from '../Table';
import ViewTransfer from '../sales/ViewTransfer';
import { useCustomAuth } from '../../context/Auth';
import { query, where } from 'firebase/firestore';
import { TotalCalc } from '../../context/TableContext';
import { useDashboard } from '../../context/DashboardContext';

const BranchTransfers = ({
  transferType,
  branch,
}: {
  transferType: 'IN' | 'OUT';
  branch: Branch;
}) => {
  const { tinnumber } = useCustomAuth();

  const [transfersQuery, setTransferQuery] = useState(
    query(
      Companies.doc(tinnumber as string)
        .sub(Branches)
        .doc(branch.id)
        .sub(Transfers).ref,
      where('transferType', '==', transferType)
    )
  );

  const { sNode } = useDashboard();

  useEffect(() => {
    if (transferType) {
      setTransferQuery(
        query(
          Companies.doc(tinnumber as string)
            .sub(Branches)
            .doc(branch.id)
            .sub(Transfers).ref,
          where('transferType', '==', transferType)
        )
      );
    }
  }, [transferType]);

  const totalCalc: TotalCalc<Transfer> = (data) => {
    return [
      {
        totalName: 'total quantity',
        value: data.reduce((acc, cur) => acc + cur.totalQuantity, 0),
      },
      {
        totalName: 'total Amount',
        value: data.reduce((acc, cur) => acc + cur.totalCost, 0),
        important: true,
      },
    ];
  };

  return (
    <Table
      collectionName={Transfers.name}
      maxCreate={0}
      canRange={true}
      hasCustomRange
      startDate={sNode.startDate}
      endDate={sNode.endDate}
      hasTotals={true}
      cantAct
      totalCalc={totalCalc}
      onShow={(instance) => (
        <ViewTransferContext transfer={instance}>
          <ViewTransfer instance={instance} />
        </ViewTransferContext>
      )}
      defaultSearchField={
        transferType === 'OUT' || !transferType ? 'toBranch' : 'fromBranch'
      }
      columns={[
        'totalQuantity',
        'totalItems',
        'totalCost',
        'fromBranch',
        'toBranch',
        'transferType',
        'status',
        'createdTime',
      ]}
      cantUpdate={true}
      cantDelete={true}
      createForm={<></>}
      query={transfersQuery}
    />
  );
};

export default BranchTransfers;
