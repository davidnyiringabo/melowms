import React, { useEffect, useMemo, useState } from 'react';
import z from 'zod';
import DynamicForm from '../Form';
import { Grant, Invoice, PropsWithPartialInstace } from '../../../types';
import { SubmitHandler } from 'react-hook-form';
import { useCustomAuth } from '../../../context/Auth';
import {
  Companies,
  CompanyBanks,
  GrantTransactions,
  Grants,
  Invoices,
} from '../../../database';
import { useFirestore } from 'reactfire';
import { query, collectionGroup, where } from 'firebase/firestore';
import { CellTransform } from '../../../context/TableContext';
import toRwf from '../../../helpers/toRwf';
import CompanyBanksForm from '../CompanyBanksForm';

const GrantTransForm = ({
  order,
  grant: initGrant,
  instance,
}: PropsWithPartialInstace<{ order?: Invoice; grant: Grant }>) => {
  const { tinnumber } = useCustomAuth();
  const [grant, setGrant] = useState(initGrant);
  const [maxPayment, setMaxPayment] = useState(0);

  useEffect(() => {
    setGrant(initGrant);
  }, [initGrant]);

  useEffect(() => {
    if (!order) return;
    setMaxPayment(order.totalCost - order.paidAmount ?? 0);
  }, [order]);

  const handleCreateGrantTrans: SubmitHandler<
    z.infer<typeof grantTransSchema>
  > = async (data) => {
    if (!instance) {
      await Companies.doc(tinnumber as string)
        .sub(Grants)
        .doc(grant.id)
        .sub(GrantTransactions)
        .addDoc(data);
    } else {
      await Companies.doc(tinnumber as string)
        .sub(Grants)
        .doc(grant.id)
        .sub(GrantTransactions)
        .doc(instance.id)
        .save(data);
    }
  };

  const invoicesQuery = query(
    collectionGroup(useFirestore(), Invoices.name),
    where('path.companies', '==', tinnumber),
    where('confirmed', '==', true)
  );
  const banksQuery = Companies.doc(tinnumber as string).sub(CompanyBanks).ref;

  const grantTransSchema = useMemo(
    () =>
      z.object({
        order: order?.id
          ? z.literal(order.id)
          : z
              .string()
              .min(1, { message: 'Choose a valid order' })
              .describe('query'),
        amount: z.number().min(1).max(maxPayment).default(maxPayment),
        type: z.literal('OUT'),
        bank: z
          .string()
          .min(1, { message: 'Choose a valid bank' })
          .describe('query'),
        bankUsed: z.string(),
        bankAccount: z
          .string()
          .min(1, 'Choose a valid bank account number')
          .describe('select'),
        transDate: z.date().default(new Date()),
        orderNumber: order?.orderNumber
          ? z.literal(order.orderNumber)
          : z.string(),
        orderBranch: order?.path?.branches
          ? z.literal(order.path.branches)
          : z.string(),
      }),
    [maxPayment]
  );

  return (
    <DynamicForm
      instance={instance}
      onSchemaChange={(setValue) => {
        setValue('amount', maxPayment);
      }}
      refineCallbacks={[
        {
          fn(data) {
            return data.type === 'IN' || data.amount <= grant.creditAmount;
          },
          args: {
            message: 'Out-going transaction contains more than borrowed sum.',
            path: ['amount'],
          },
        },
        {
          fn(data) {
            return data.type === 'OUT' || data.amount <= grant.balance;
          },
          args: {
            message: 'In-coming transaction contains more than balance.',
            path: ['amount'],
          },
        },
      ]}
      schema={grantTransSchema}
      onSubmit={handleCreateGrantTrans}
      metadata={{
        bankUsed: { hidden: true },
        orderNumber: { hidden: true },
        orderBranch: { hidden: true },
        bankAccount: {
          options: [],
          onlyOptions: true,
          label: 'Bank Account Number',
        },
        amount: { label: 'Transaction Amount' },
        transDate: {
          watchFields: ['orderNumber'],
          label: 'Transaction Date',
        },
        bank: {
          query: banksQuery,
          onSelect(record, setValue, modifyFieldMeta) {
            setValue('bankUsed', record.name);
            modifyFieldMeta('bankAccount', {
              options: (
                (record.accounts ?? {}) as [{ accountNumber: string }]
              ).reduce((acc, c) => {
                acc[c.accountNumber] = c.accountNumber;
                return acc;
              }, {} as { [k: string]: any }),
            });
          },
          display: 'name',
          addForm: <CompanyBanksForm />,
          getUpdateForm: (instance) => <CompanyBanksForm instance={instance} />,
          canSearchQuery: true,
        },
        order: {
          cantAdd: true,
          query: invoicesQuery,
          onSelect(record, setValue) {
            // const shipmentCost =
            //   ((record as any).shipmentCost as number | undefined) ??
            //   (record.totalQuantity ?? 0) * 300;
            // const exciseDuties =
            //   ((record as any).exciseDuties as number | undefined) ??
            //   ((record.totalCost ?? 0) * 60) / 100;
            const amountToBePaid = record.totalCost ?? 0;

            setMaxPayment(
              Number((amountToBePaid - (record.paidAmount ?? 0)).toFixed(2))
            );
            // (Updating) When a different order is choosen
            if (!instance || instance.orderNumber !== record.orderNumber)
              setValue('amount', amountToBePaid - (record.paidAmount ?? 0));

            setValue('orderNumber', record.orderNumber, {
              shouldValidate: false,
            });
            setValue('orderBranch', (record as Invoice).path.branches);
          },
          canSearchQuery: true,
          display: 'orderNumber',
          columns: [
            'orderNumber',
            'invoiceNumber',
            'amountToBePaid',
            'shipmentDate',
            'createdTime',
          ],
          transform: {
            amountToBePaid(record) {
              // const shipmentCost =
              //   ((record as any).shipmentCost as number | undefined) ??
              //   (record.totalQuantity ?? 0) * 300;
              // const exciseDuties =
              //   ((record as any).exciseDuties as number | undefined) ??
              //   ((record.totalCost ?? 0) * 60) / 100;
              const amountToBePaid = record.totalCost;
              return toRwf(amountToBePaid);
            },
          } as CellTransform<any>,
        },
        type: {
          label: 'Transaction Type',
          helpText:
            'Type of the transaction. IN for incoming payment, and OUT for outgoing payments.',
        },
      }}
    />
  );
};

export default GrantTransForm;
