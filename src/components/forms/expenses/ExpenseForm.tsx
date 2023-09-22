import React from 'react';
import { z } from 'zod';
import {
  CommonExpenses,
  Expense,
  PropsWithPartialInstace,
} from '../../../types';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';
import { useCustomAuth } from '../../../context/Auth';
import { BranchExpenses, DocNode } from '../../../database';

const ExpenseForm = ({
  instance,
}: PropsWithPartialInstace<unknown, Expense>) => {
  const { currentUser, Branch } = useCustomAuth();

  const expenseSchema = z.object({
    category: z.enum([
      Object.values(CommonExpenses)[0],
      ...Object.values(CommonExpenses).slice(1),
    ]),
    amount: z.number(),
    paymentDate: z.date().default(new Date()),
    approved: z.literal(false),
    description: z.string().min(5).describe('textarea'),
    approvedBy: z.literal(''),
    approvedByName: z.literal(''),
    doneBy: z.literal(currentUser?.uid ?? ''),
    doneByName: z.literal(currentUser?.displayName ?? ''),
    receipt: z.literal(''),
  });

  if (instance?.approved) {
    return <p>This expense is approved, it can't be updated.</p>;
  }

  const handleCreateExpense: SubmitHandler<
    z.infer<typeof expenseSchema>
  > = async (data) => {
    const expenses = (Branch as DocNode).sub(BranchExpenses);
    if (!instance) {
      await expenses.addDoc(data);
    } else {
      await expenses.doc(instance.id).save(data);
    }
  };

  return (
    <DynamicForm
      instance={instance}
      schema={expenseSchema}
      onSubmit={handleCreateExpense}
    />
  );
};

export default ExpenseForm;
