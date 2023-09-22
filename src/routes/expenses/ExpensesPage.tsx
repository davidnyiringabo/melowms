import { useEffect, useState } from 'react';
import { useCustomAuth } from '../../context/Auth';
import { onSnapshot } from 'firebase/firestore';
import { BranchExpenses, Branches, Companies, DocNode } from '../../database';
import Table from '../../components/Table';
import ExpenseForm from '../../components/forms/expenses/ExpenseForm';
import { Branch, Expense } from '../../types';
import { TotalCalc } from '../../context/TableContext';
import ExpenseComp from '../../components/feature/Expense';
import { MdOtherHouses } from 'react-icons/md';

const ExpensesPage = () => {
  const { Branch, tinnumber, isAdmin } = useCustomAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);

  // const baseQuery =
  const expensesQuery = isAdmin
    ? Companies.doc(tinnumber as string)
        .sub(Branches)
        .doc(
          branches.find((_, i) => i === activeTab)?.id ?? 'non-existent-branch'
        )
        .sub(BranchExpenses).ref
    : (Branch as DocNode).sub(BranchExpenses).ref;

  const branchesQuery =
    isAdmin && Companies.doc(tinnumber as string).sub(Branches);

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

  useEffect(() => {
    if (!branchesQuery) return;

    const unsubscribe = onSnapshot(branchesQuery.ref, (snapshot) => {
      let allBranches: Branch[] = [];
      snapshot.docs.forEach((doc) => {
        allBranches.push({ ...doc.data(), id: doc.id } as Branch);
      });
      setBranches([...allBranches]);
    });
    return unsubscribe;
  }, [branchesQuery]);

  return (
    <div className="p-2 px-4 flex flex-col">
      <h3 className="text-lg mx-1 mb-2 font-bold">Expenses</h3>
      <div className="text-sm pr-2 mx-1 w-full font-medium text-center text-gray-500  ">
        <ul className="flex rounded bg-blue-50 flex-wrap w-full -mb-px">
          <li>
            {branches.map((branch, i) => (
              <button
                key={branch.id}
                onClick={() => setActiveTab(i)}
                className={`inline-flex items-center gap-2 ${
                  activeTab !== i
                    ? `p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300`
                    : ` p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active `
                }`}
              >
                <MdOtherHouses />
                {branch.name}
              </button>
            ))}
          </li>
        </ul>
      </div>

      <Table
        query={expensesQuery}
        hasTotals
        totalCalc={totalCalc}
        canRange
        onShow={(instance) => <ExpenseComp instance={instance} />}
        createForm={<ExpenseForm />}
        cantDelete={(instance) => instance.approved}
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
    </div>
  );
};

export default ExpensesPage;
