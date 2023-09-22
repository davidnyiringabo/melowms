import React, { useState } from 'react';
import {
  Customer,
  PropsWithInstace,
  CustomerFinancesType,
} from '../../../types';
import { CustomerFinances, Customers, DocNode } from '../../../database';
import { useCustomAuth } from '../../../context/Auth';
import DynamicForm from '../Form';
import { custom, z } from 'zod';
import { SubmitHandler } from 'react-hook-form';

const financesSchema = z.object({
  customerName: z.string(),
  type: z.literal('IN'),
  amount: z.number().step(0.01).min(0.01),
  transDate: z.date().default(new Date()),
});

const CustomerTransForm = ({
  instance: customer,
  finance,
}: PropsWithInstace<{ finance?: CustomerFinancesType }, Customer>) => {
  const { Branch } = useCustomAuth();

  const finances = (Branch as DocNode)
    .sub(Customers)
    .doc(customer.id)
    .sub(CustomerFinances);

  const handleCreateFinance: SubmitHandler<
    z.infer<typeof financesSchema>
  > = async (data) => {

    if (!finance) {
      finances.addDoc<Omit<CustomerFinancesType, 'path' | 'id'>>(data);
    } else {
      finances
        .doc(finance.id)
        .save<Omit<CustomerFinancesType, 'path' | 'id'>>(data);
    }
  };

  return (
    <DynamicForm
      instance={finance}
      schema={financesSchema.extend({
        customerName: z.literal(customer.name),
      })}
      onSubmit={handleCreateFinance}
    />
  );
};

export default CustomerTransForm;
