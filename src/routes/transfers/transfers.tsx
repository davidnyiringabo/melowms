import { useEffect, useState } from 'react';
import withAuthorization from '../../components/hocs/withAuthorization';
import { useCustomAuth } from '../../context/Auth';
import { DocNode, Transfers } from '../../database';
import Table from '../../components/Table';
import { Query, query, where } from 'firebase/firestore';
import ViewTransfer from '../../components/sales/ViewTransfer';
import ViewTransferContext from '../../context/ViewTransferContext';
import { TotalCalc } from '../../context/TableContext';
import { Transfer } from '../../types';

type TransferPageProps = {
  transferType?: 'IN' | 'OUT';
};

const TransferPage = ({ transferType }: TransferPageProps) => {
  const { Branch, reloadTransferCount } = useCustomAuth();
  const [transfersQuery, setTransferQuery] = useState(
    (Branch as DocNode).sub(Transfers).ref as Query
  );
  useEffect(() => {
    reloadTransferCount();
  }, []);
  useEffect(() => {
    if (transferType) {
      setTransferQuery(
        query(
          (Branch as DocNode).sub(Transfers).ref,
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
      hasTotals={true}
      totalCalc={totalCalc}
      onShow={(instance) => (
        <ViewTransferContext transfer={instance}>
          <ViewTransfer instance={instance} />
        </ViewTransferContext>
      )}
      defaultSearchField={
        transferType === 'OUT' || !transferType ? 'toBranch' : 'fromBranch'
      }
      orderBy={{ direction: 'desc', field: 'createdTime' }}
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

export default withAuthorization({ requiredClaims: { manager: true } })(
  TransferPage
);
