import React, { useEffect, useState } from 'react';
import { Expense, PropsWithInstace } from '../../types';
import toRwf from '../../helpers/toRwf';
import { useCustomAuth } from '../../context/Auth';
import { MdCheck } from 'react-icons/md';
import { useFirestore } from 'reactfire';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { BranchExpenses, Branches, Companies } from '../../database';
import { useModalContext } from '../../context/ModalContext';

const Expense = ({ instance: exp }: PropsWithInstace<unknown, Expense>) => {
  const { isAdmin, currentUser, tinnumber } = useCustomAuth();

  const [expense, setExpense] = useState(exp);
  const { handleClose } = useModalContext();

  useEffect(() => {
    setExpense(exp);
  }, [exp]);

  const handleApprove = async () => {
    const exp = Companies.doc(tinnumber as string)
      .sub(Branches)
      .doc((expense.path as any).branches)
      .sub(BranchExpenses)
      .doc(expense.id);

    await exp.save<
      Pick<Expense, 'approved' | 'approvedBy' | 'approvedByName' | 'approvedAt'>
    >({
      approved: true,
      approvedBy: currentUser?.uid ?? '',
      approvedByName: currentUser?.displayName ?? '',
      approvedAt: Timestamp.now(),
    });
    handleClose();
  };

  return (
    <div className="bg-white rounded shadow p-4">
      {isAdmin && !expense.approved && (
        <div className="flex justify-end mb-2 border-b pb-2 items-center">
          <button onClick={handleApprove} className="btn">
            Approve <MdCheck />
          </button>
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">{expense.category}</h2>
      <div className="flex flex-col gap-2">
        <p className=" text-blue-600">Amount: {toRwf(expense.amount)}</p>
        <p className="text-gray-600">
          Payment Date:{' '}
          {(expense.paymentDate as any).toDate().toLocaleDateString()}
        </p>
        <p
          className={` ${expense.approved ? 'text-green-500' : 'text-red-700'}`}
        >
          Approved: {expense.approved ? 'Yes' : 'No'}
        </p>
        {expense.approved && (
          <p className="text-gray-600">Approved By: {expense.approvedByName}</p>
        )}
        <p className="text-gray-600 font-bold">Done By: {expense.doneByName}</p>
        {expense.receipt && (
          <p className="text-gray-600">Receipt: {expense.receipt}</p>
        )}
        <p className="text-gray-600 flex flex-col ">
          <span className="font-bold">Description:</span>
          <span>{expense.description}</span>
        </p>
      </div>
    </div>
  );
};

export default Expense;
