import React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { useCustomAuth } from '../../context/Auth';
import { Companies, CompanyBanks } from '../../database';
import { PropsWithPartialInstace } from '../../types';
import DynamicForm from './Form';

const companyBankSchema = z.object({
  name: z.enum([
    'Bank of Kigali',
    'Cogebank',
    'Equity Bank',
    'I&M Bank',
    'BPR',
  ]),
  accounts: z
    .array(
      z.object({
        accountNumber: z
          .string()
          .regex(/\d+/, { message: '"Bank account should be numeric only' })
          .min(1, { message: "Bank account can't be empty" }),
      })
    )
    .min(1),
  owner: z.string(),
});

const CompanyBanksForm = ({ instance }: PropsWithPartialInstace) => {
  const { tinnumber } = useCustomAuth();
  const handleCreateBank: SubmitHandler<
    z.infer<typeof companyBankSchema>
  > = async (data) => {
    const banks = Companies.doc(tinnumber as string).sub(CompanyBanks);
    if (!instance) {
      await banks.addDoc(data);
    } else {
      banks.doc(instance.id).save(data);
    }
  };

  return (
    <DynamicForm
      instance={instance}
      onSubmit={handleCreateBank}
      schema={companyBankSchema}
    />
  );
};

export default CompanyBanksForm;
