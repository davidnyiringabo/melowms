import { query, collectionGroup, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useCustomAuth } from '../../context/Auth';
import { Orders } from '../../database';
import { OrderItems } from '../../routes/orders/orders';
import { Branch, Order } from '../../types';
import Table from '../Table';
import { useDashboard } from '../../context/DashboardContext';
import { TotalCalc } from '../../context/TableContext';

export default function BranchSales({ branch }: { branch: Branch }) {
  const { tinnumber } = useCustomAuth();
  const ordersQuery = query(
    collectionGroup(useFirestore(), Orders.name),
    where('path.companies', '==', tinnumber),
    where('path.branches', '==', branch.id)
  );
  const { sNode } = useDashboard();

  const totalCalc: TotalCalc<Order> = (data) => {
    return [
      {
        totalName: 'Total Quantity',
        value: data.reduce((a, c) => a + c.totalQuantity, 0),
      },
      {
        totalName: 'Total Amount',
        value: data.reduce((a, c) => a + c.totalCost, 0),
        important: true,
      },
    ];
  };

  return (
    <div>
      <Table
        query={ordersQuery}
        onShow={(instance) => <OrderItems canModify={false} order={instance} />}
        cantView={true}
        hasTotals
        totalCalc={totalCalc}
        cantUpdate={true}
        hasCustomRange
        startDate={sNode.startDate}
        endDate={sNode.endDate}
        canRange
        cantDelete={true}
        maxCreate={0}
        collectionName={'Sales'}
        defaultSearchField={'customerName'}
        columns={[
          'customerName',
          'totalQuantity',
          'totalItems',
          'discount',
          'totalCost',
          'costAfterDiscount',
          'createdTime',
        ]}
        createForm={undefined}
      ></Table>
    </div>
  );
}
