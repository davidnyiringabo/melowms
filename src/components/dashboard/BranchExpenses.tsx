import React from 'react';
import { Branch, Expense } from '../../types';
import Table from '../Table';
import ExpenseForm from '../forms/expenses/ExpenseForm';
import {
  Branches,
  BranchExpenses as BranchExp,
  Companies,
} from '../../database';
import { useCustomAuth } from '../../context/Auth';
import { TotalCalc } from '../../context/TableContext';
import ExpenseComp from '../../components/feature/Expense';
import { useDashboard } from '../../context/DashboardContext';

const BranchExpenses = ({ branch }: { branch: Branch }) => {
  const { tinnumber } = useCustomAuth();
  const { sNode } = useDashboard();
  const expensesQuery = Companies.doc(tinnumber as string)
    .sub(Branches)
    .doc(branch.id)
    .sub(BranchExp).ref;

  const totalCalc: TotalCalc<Expense> = (data) => {
    return [
      {
        totalName: 'Total Approved',
        value: data.reduce((a, c) => a + (c.approved ? c.amount : 0), 0),
        important: true,
      },
      {
        totalName: 'TotalAmount',
        value: data.reduce((a, c) => a + c.amount, 0),
        important: true,
      },
    ];
  };
  return (
    <Table
      query={expensesQuery}
      hasTotals
      totalCalc={totalCalc}
      hasCustomRange
      startDate={sNode.startDate}
      endDate={sNode.endDate}
      cantUpdate
      maxCreate={0}
      canRange
      onShow={(instance) => <ExpenseComp instance={instance} />}
      createForm={<ExpenseForm />}
      getUpdateForm={(instance) =>
        instance.approved ? (
          <p>This expense is approved, it can't be updated.</p>
        ) : (
          <ExpenseForm instance={instance as Expense} />
        )
      }
      columns={[
        'category',
        'amount',
        'approved',
        'description',
        'doneByName',
        'paymentDate',
      ]}
      columsAs={{ doneByName: 'Done By' }}
      collectionName="Expenses"
    />
  );
};

export default BranchExpenses;
