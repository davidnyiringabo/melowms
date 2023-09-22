import Table from '../../components/Table';
import CustomerForm from '../../components/forms/sales/CustomerForm';
import { Customers } from '../../database';
import { useCustomAuth } from '../../context/Auth';
import { Query } from 'firebase/firestore';
import Customer from '../../components/feature/Customer';

const CustomersPage = () => {
  const { Branch, tinnumber } = useCustomAuth();

  const customersQuery = Branch?.sub(Customers).ref;

  return (
    <Table
      query={customersQuery as Query}
      defaultSearchField="name"
      onShow={(instance) => <Customer instance={instance} />}
      collectionName={Customers.name}
      columns={[
        'name',
        'tinnumber',
        'phone',
        // 'address',
        'email',
        'emptiesBalance',
        'totalCredit',
      ]}
      transform={{
        totalCredit: (record) => (
          <span
            className={`inline-flex cursor-pointer h-6 font-bold rounded justify-center items-center p-2 w-full ${
              (record.totalCredit ?? 0) < 0
                ? 'bg-red-400/60'
                : 'bg-green-400/60'
            }`}
            title={`${
              (record.totalCredit ?? 0) < 0 ? 'Customer' : 'You'
            } needs to pay ${Math.abs(record.totalCredit)}`}
          >
            {record.totalCredit ?? 0}
          </span>
        ),
      }}
      columsAs={{ emptiesBalance: 'Emballage', totalCredit: 'Balance' }}
      createForm={<CustomerForm />}
      getUpdateForm={(instance) => <CustomerForm instance={instance} />}
    />
  );
};

export default CustomersPage;
