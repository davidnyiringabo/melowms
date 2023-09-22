import { z } from 'zod';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';
import { CalcFunction } from '../../../context/DynamicFormContext';
import {
  Branch,
  PropsWithPartialInstace,
  RefineCallback,
} from '../../../types';
import { useCustomAuth } from '../../../context/Auth';
import { Branches, Companies, Grants, Suppliers } from '../../../database';
import { query, collectionGroup, where, getDocs } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import SupplierForm from '../SupplierForm';
import { useEffect, useState } from 'react';
import Spinner from '../../Spinner';

const grantSchema = z.object({
  supplier: z
    .string()
    .trim()
    .min(1, { message: 'A supplier is required' })
    .describe('query'),
  supplierBranch: z.string().min(1),
  supplierName: z.string().min(1),
  totalAmount: z.number().min(0).default(0),
  balance: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  alertAmount: z.number().min(0).default(0),
});

const refineBalance: RefineCallback<typeof grantSchema> = (data) => {
  return data.balance <= data.totalAmount;
};
const refinedBalanceArgs = {
  message: "Balance can't be greater than total amount",
  path: ['balance'],
};

const refineCreditAmount: RefineCallback<typeof grantSchema> = (data) => {
  return data.creditAmount <= data.totalAmount;
};

const refineCreditAmountArgs = {
  message: "Credit amount can't be greater than total amount",
  path: ['creditAmount'],
};

const calculateBalance: CalcFunction = ({ fields, setValue }) => {
  const num = (v: any) => Number(v || 0) || 0;
  const [totalAmount, creditAmount] = fields;
  const newValue = num(totalAmount) - num(creditAmount);
  setValue('balance', newValue || 0);
};

const GrantForm = ({ instance }: PropsWithPartialInstace) => {
  const { tinnumber } = useCustomAuth();
  const [mainBranch, setMainBranch] = useState<Branch>();
  const mainBranchQuery = query(
    Companies.doc(tinnumber as string).sub(Branches).ref,
    where('isMain', '==', true)
  );

  useEffect(() => {
    getDocs(mainBranchQuery).then((snap) => {
      if (!snap.size) {
        throw new Error(`Can't find main branch!`);
      }
      const branch: Branch = snap.docs[0].data() as Branch;
      branch.id = snap.docs[0].id;
      setMainBranch(branch);
    });
  }, []);

  useEffect(() => {
    console.log({ mainBranch });
  }, [mainBranch]);

  const suppliersQuery = query(
    collectionGroup(useFirestore(), Suppliers.name),
    where('path.companies', '==', tinnumber)
  );

  const handleCreateGrant: SubmitHandler<z.infer<typeof grantSchema>> = async (
    data
  ) => {
    if (!instance) {
      await Companies.doc(tinnumber as string)
        .sub(Grants)
        .addDoc(data);
    } else {
      await Companies.doc(tinnumber as string)
        .sub(Grants)
        .doc(instance.id)
        .save(data);
    }
  };

  return !mainBranch ? (
    <Spinner />
  ) : (
    <DynamicForm
      instance={instance}
      schema={grantSchema}
      refineCallbacks={[
        { fn: refineCreditAmount, args: refineCreditAmountArgs },
        { fn: refineBalance, args: refinedBalanceArgs },
        {
          fn: (data) => data.alertAmount <= Number(data.totalAmount) / 2,
          args: {
            message: 'Alert amount must be less than half total amount.',
            path: ['alertAmount'],
          },
        },
      ]}
      onSubmit={handleCreateGrant}
      metadata={{
        supplierName: {
          hidden: true,
        },
        supplierBranch: {
          hidden: true,
        },
        supplier: {
          addForm: <SupplierForm branch={mainBranch} />,
          canSearchQuery: true,
          searchField: 'name',
          query: suppliersQuery,
          onSelect(record, setValue) {
            setValue('supplierName', record?.name ?? '');
            setValue('supplierBranch', record?.path?.branches ?? '');
          },
          getUpdateForm(instance) {
            return <p>To edit a supplier go to a branch.</p>;
          },
          display: 'name',
          value: 'id',
        },
        totalAmount: { label: 'Total Granted Amount' },
        alertAmount: { label: 'Minimum Amount' },
        creditAmount: {
          label: 'Borrowed Sum',
          disabled: true,
        },
        balance: {
          calculate: calculateBalance,
          watchFields: ['totalAmount', 'creditAmount'],
          disabled: true,
        },
      }}
    />
  );
};

export default GrantForm;
