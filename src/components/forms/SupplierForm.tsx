import { useCustomAuth } from '../../context/Auth';
import { Branches, Companies, DocNode, Suppliers } from '../../database';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import withAuthorization from '../hocs/withAuthorization';
import DynamicForm from './Form';
import { Branch, Supplier } from '../../types';
import { useEffect } from 'react';

const supplierSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z
    .string()
    .regex(
      /[^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$]?/,
      'Incorrect phone number format'
    )
    .optional()
    .or(z.literal('')),
  tinnumber: z.string().regex(/^\d{9}$/, { message: 'Should be 9 numbers' }),
  branchId: z
    .string()
    .regex(/\d+/, { message: 'Should be numeric' })
    .default('01'),
  address: z.string().min(1),
  SDCIds: z.array(z.object({ sdcId: z.string().min(1) })).min(1),
});

const SupplierForm = ({
  supplier,
  branch,
}: {
  branch?: Branch;
  supplier?: Supplier;
}) => {
  const { tinnumber, Branch } = useCustomAuth();
  const handleCreateSupplier: SubmitHandler<
    z.infer<typeof supplierSchema>
  > = async (data) => {
    const BranchDoc = !branch
      ? Branch
      : Companies.doc(tinnumber as string)
          .sub(Branches)
          .doc(branch.id);
    if (supplier) {
      return await (BranchDoc as DocNode)
        .sub(Suppliers)
        .doc(supplier.id as string)
        .save(data);
    } else {
      await (BranchDoc as DocNode).sub(Suppliers).addDoc(data);
    }
  };

  useEffect(() => {
    console.log({ branch });
  }, [branch]);

  return (
    <DynamicForm
      instance={supplier}
      multiLevel={true}
      inputsPerLevel={4}
      schema={supplierSchema}
      metadata={{ branchId: { hidden: true } }}
      onSubmit={handleCreateSupplier}
    />
  );
};

export default withAuthorization({
  requiredClaims: { manager: true, admin: true },
  all: false,
})(SupplierForm);
