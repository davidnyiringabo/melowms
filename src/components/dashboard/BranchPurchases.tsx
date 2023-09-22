import { query, collectionGroup, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useCustomAuth } from '../../context/Auth';
import { Invoices, Companies, Branches, Suppliers } from '../../database';
import { Branch, Invoice as InvoiceType } from '../../types';
import Table from '../Table';
import Invoice from '../feature/Invoice';
import { useDashboard } from '../../context/DashboardContext';
import { TotalCalc } from '../../context/TableContext';

export default function BranchPurchases({ branch }: { branch: Branch }) {
  const { tinnumber } = useCustomAuth();
  const firestore = useFirestore();
  const invoicesQuery = query(
    collectionGroup(firestore, Invoices.name),
    where('path.companies', '==', tinnumber),
    where('path.branches', '==', branch.id),
    where('confirmed', '==', true)
  );
  const { sNode } = useDashboard();

  const totalCalc: TotalCalc<Invoice> = (data) => {
    return [
      {
        totalName: 'Total VAT',
        value: data.reduce((acc, c) => acc + (c.totalTaxAmount ?? 0), 0),
      },
      {
        totalName: 'Total Amount',
        important: true,
        value: data.reduce((acc, c) => acc + (c.totalCost ?? 0), 0),
      },
    ];
  };

  return (
    <div>
      <Table
        collectionName={'purchases'}
        onShow={(instance) => <Invoice invoice={instance} />}
        cantView
        hasCustomRange
        hasTotals
        totalCalc={totalCalc}
        startDate={sNode.startDate}
        endDate={sNode.endDate}
        canRange
        defaultSearchField="orderNumber"
        columns={[
          'orderNumber',
          'supplier',
          'purchaseDate',
          'paymentMethod',
          'totalTaxAmount',
          'totalCost',
          'confirmed',
          'createdTime',
        ]}
        columsAs={{
          purchaseDate: 'pur.Date',
          orderNumber: 'orderNo',
          totalTaxAmount: 'totTax',
          paymentMethod: 'payMthd',
          totalCost: 'totAmnt',
        }}
        query={invoicesQuery}
        createForm={<></>}
        maxCreate={0}
        cantUpdate={true}
      />
    </div>
  );
}
