import { useCustomAuth } from '../../context/Auth';
import { Branches, Companies, DocNode } from '../../database';
import { getDocs, query, and, where } from 'firebase/firestore';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';
import DynamicForm from './Form';
import { PropsWithPartialInstace } from '../../types';

const CreateBranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
});

type BranchData = z.infer<typeof CreateBranchSchema>;

const CreateBranchForm = ({ instance }: PropsWithPartialInstace) => {
  const { Company, tinnumber } = useCustomAuth();
  const handleCreateBranch: SubmitHandler<BranchData> = async (data) => {
    if (!instance) {
      const getBranchWithName = query(
        Companies.doc(tinnumber as string).sub(Branches).ref,
        where('name', '==', data.name)
      );
      const snapShot = await getDocs(getBranchWithName);
      if (snapShot.size > 0) {
        return toast.error(`Branch "${data.name}" already exists`);
      }
      Company?.sub(Branches).addDoc({
        ...data,
        company: Company.id,
      });
    } else {
      Company?.sub(Branches)
        .doc(instance.id)
        .save({
          ...data,
          company: Company.id,
        });
    }
  };
  return (
    <DynamicForm
      instance={instance}
      schema={CreateBranchSchema}
      onSubmit={handleCreateBranch}
    />
  );
};

export default CreateBranchForm;
