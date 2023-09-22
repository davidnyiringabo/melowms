import { useEffect } from 'react';
import withAuthorization from '../../components/hocs/withAuthorization';
import { useCustomAuth } from '../../context/Auth';
import { Companies, GrantTransactions, Grants, Invoices } from '../../database';
import Table from '../../components/Table';
import GrantForm from '../../components/forms/grants/GrantForm';
import { Grant, Invoice as InvoiceType, PropsWithInstace } from '../../types';
import GrantTransForm from '../../components/forms/grants/GrantTransForm';
import { useModalContext } from '../../context/ModalContext';
import { useFirestore } from 'reactfire';
import { query, collectionGroup, where } from 'firebase/firestore';
import { TotalCalc } from '../../context/TableContext';
import toRwf from '../../helpers/toRwf';

const Finances = () => {
  const { tinnumber } = useCustomAuth();

  const financesQuery = Companies.doc(tinnumber as string).sub(Grants).ref;

  return (
    <div className="flex p-2 flex-col">
      <h3 className="text-lg ml-3 border-b py-2 font-semibold">Grants</h3>
      <Table
        query={financesQuery}
        // canRange={true}
        defaultSearchField="supplierName"
        maxCreate={1}
        columns={[
          'supplierName',
          'totalAmount',
          'balance',
          'creditAmount',
          'alertAmount',
        ]}
        columsAs={{
          supplierName: 'supplier',
          totalAmount: 'Total Granted Amount',
          alertAmount: 'Minimum Amount',
          creditAmount: 'Borrowed Sum',
        }}
        // transform={'supplier': (record)}
        cantDelete={true}
        onShow={(instance) => <GrantInvoices grant={instance} />}
        collectionName="Grants"
        createForm={<GrantForm />}
        getUpdateForm={(instance) => <GrantForm instance={instance} />}
      />
    </div>
  );
};

export function GrantInvoices({ grant }: { grant: Grant }) {
  // const query = Companies.doc(tinnumber as string).sub(Grants);
  const { tinnumber } = useCustomAuth();
  const firestore = useFirestore();
  const { changeTitle } = useModalContext();
  const invoicesQuery = query(
    collectionGroup(firestore, Invoices.name),
    where('path.companies', '==', tinnumber),
    where('confirmed', '==', true)
  );

  useEffect(() => {
    changeTitle('View Orders');
  });

  const totalCalc: TotalCalc<InvoiceType> = (data) => {
    return [
      {
        totalName: 'Total VAT',
        value: data.reduce((acc, c) => acc + (c.totalTaxAmount ?? 0), 0),
      },
      {
        totalName: 'Total Paid Amount',
        value: data.reduce((acc, c) => acc + (c.paidAmount ?? 0), 0),
      },
      {
        totalName: 'Total Amount',
        important: true,
        value: data.reduce((acc, c) => acc + (c.totalCost ?? 0), 0),
      },
    ];
  };

  return (
    <Table
      collectionName={'purchases'}
      onShow={(instance) => (
        <ViewGrantTransactions order={instance} instance={grant} />
      )}
      cantView={false}
      hasTotals
      totalCalc={totalCalc}
      canRange
      defaultSearchField="orderNumber"
      columns={[
        'orderNumber',
        'supplier',
        'purchaseDate',
        'totalTaxAmount',
        'paidAmount',
        'remaining',
        'totalCost',
        'createdTime',
      ]}
      columsAs={{
        purchaseDate: 'pur.Date',
        orderNumber: 'orderNo',
        totalTaxAmount: 'totTax',
        paymentMethod: 'payMthd',
        totalCost: 'totAmnt',
      }}
      transform={{
        remaining(record) {
          return (
            <span>
              {toRwf((record.totalCost ?? 0) - (record.paidAmount ?? 0))}
            </span>
          );
        },
        paidAmount(record) {
          const inv = record as InvoiceType;
          return (
            <span className="h-6 relative w-full text-center rounded border border-green-700 block bg-green-200">
              <span
                style={{ width: `${(inv.paidAmount * 100) / inv.totalCost}%` }}
                className="h-full block bg-green-500"
              />
              <span className="absolute top-1/2 left-1/2 font-bold -translate-x-1/2 -translate-y-1/2 ">
                {toRwf(inv.paidAmount)}
              </span>
            </span>
          );
        },
      }}
      query={invoicesQuery}
      createForm={<></>}
      maxCreate={0}
      cantUpdate={true}
    />
  );
}

export function ViewGrantTransactions({
  order,
  instance: grant,
}: PropsWithInstace<{ order: InvoiceType }, Grant>) {
  const { tinnumber } = useCustomAuth();
  const { changeTitle, changeSize } = useModalContext();

  const grantTransQuery = query(
    Companies.doc(tinnumber as string)
      .sub(Grants)
      .doc(grant.id)
      .sub(GrantTransactions).ref,
    where('order', '==', order.id)
  );

  useEffect(() => {
    changeTitle(`Transactions for order "${order.orderNumber}" `);
    changeSize('lg');
  }, []);

  return (
    <div className="flex flex-col">
      {/* <h3 className="text-lg ml-3 border-b py-2 font-semibold">Transactions</h3> */}
      <Table
        query={grantTransQuery}
        cantView={true}
        canRange
        defaultSearchField="orderNumber"
        getUpdateForm={(instance) => (
          <GrantTransForm order={order} grant={grant} instance={instance} />
        )}
        columns={['orderNumber', 'amount', 'type', 'transDate', 'createdTime']}
        createForm={<GrantTransForm order={order} grant={grant} />}
        collectionName={'Transactions'}
      />
    </div>
  );
}

export default withAuthorization({
  requiredClaims: { manager: true, admin: true, superAdmin: false },
  all: false,
})(Finances);
