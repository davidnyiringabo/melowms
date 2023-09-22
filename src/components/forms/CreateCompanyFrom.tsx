import React from 'react';
import { toast } from '../ToasterContext';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Companies } from '../../database';
import DynamicForm from './Form';

const CompanyFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(3),
  tinnumber: z.string().length(9).regex(/\d{9}/),
});

type CompanyFormSchemaType = z.infer<typeof CompanyFormSchema>;

const CreateCompanyForm: React.FC = ({}) => {
  const handleCreateCompany: SubmitHandler<CompanyFormSchemaType> = async (
    data
  ) => {
    const doc = Companies.doc(data.tinnumber);
    const comp = await doc.get();
    if (comp.exists()) {
      return toast.error('Company with that "tinnumber" exists!');
    }
    doc.data = data;
    doc
      .save()
      .then(() => toast.success(`Company ${data.name} was created!`))
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="w-full">
      <DynamicForm schema={CompanyFormSchema} onSubmit={handleCreateCompany} />
    </div>
  );
};

export default CreateCompanyForm;
