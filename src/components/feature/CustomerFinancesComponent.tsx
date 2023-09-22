import React from 'react';
import { Customer, CustomerFinancesType, PropsWithInstace } from '../../types';
import { useCustomAuth } from '../../context/Auth';
import { CustomerFinances, Customers, DocNode } from '../../database';
import Table from '../Table';
import CustomerTransForm from '../forms/sales/CustomerTransForm';
import { TotalCalc } from '../../context/TableContext';

export const CustomerFinancesComponent = ({
  instance: customer,
}: PropsWithInstace<unknown, Customer>) => {
  const { Branch } = useCustomAuth();

  const finances = (Branch as DocNode)
    .sub(Customers)
    .doc(customer.id)
    .sub(CustomerFinances);

  const totalCalc: TotalCalc<CustomerFinancesType> = (data) => {
    return [
      {
        totalName: 'total IN amount',
        value: data.reduce((a, c) => a + (c.type === 'IN' ? c.amount : 0), 0),
        important: true,
      },
      {
        totalName: 'total OUT amount',
        value: data.reduce((a, c) => a + (c.type === 'OUT' ? c.amount : 0), 0),
        important: true,
      },
    ];
  };

  return (
    <Table
      query={finances.ref}
      collectionName="Transactions"
      canRange
      cantView
      hasTotals
      totalCalc={totalCalc}
      columns={['type', 'amount', 'transDate']}
      createForm={<CustomerTransForm instance={customer} />}
      getUpdateForm={(instance) => (
        <CustomerTransForm
          instance={customer}
          finance={instance as CustomerFinancesType}
        />
      )}
    />
  );
};
