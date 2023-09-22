import z from 'zod';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';
import { query, where } from 'firebase/firestore';
import { CreateFormProps } from '../../../types';
import withAuthorization from '../../hocs/withAuthorization';
import { useCustomAuth } from '../../../context/Auth';
import { Customers, DocNode } from '../../../database';
import { getDocs } from 'firebase/firestore';
import { CollectionReference } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const customerSchema = z.object({
  name: z.string().min(1),
  tinnumber: z.string().length(9).regex(/\d{9}/).or(z.literal('')).optional(),
  phone: z
    .string()
    .regex(
      /[^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$]?/,
      'Incorrect phone number format'
    )
    .optional()
    .or(z.literal('')),
  address: z.string().min(3).optional(),
  email: z.string().email().or(z.literal('')).optional(),
  defaultDiscount: z.number().default(0),
});

const CustomerForm = ({ instance }: CreateFormProps) => {
  const { Branch } = useCustomAuth();

  const handleCreateCustomer: SubmitHandler<
    z.infer<typeof customerSchema>
  > = async (data) => {
    const customerCol = (Branch as DocNode).sub(Customers);
    const tinExists =
      !instance &&
      data.tinnumber &&
      (await fieldValueExists({
        collection: customerCol.ref,
        fieldName: 'tinnumber',
        value: data.tinnumber,
      }));

    const phoneExists =
      !instance &&
      data.phone &&
      (await fieldValueExists({
        collection: customerCol.ref,
        fieldName: 'phone',
        value: data.phone,
      }));

    if (tinExists) {
      toast.error(`Customer with tinnumber '${data.tinnumber}' exists.`);
      return await Promise.reject();
    }
    if (phoneExists) {
      toast.error(`Customer with phone number '${data.tinnumber}' exists.`);
      return await Promise.reject();
    }

    if (!instance) await customerCol.addDoc(data);
    else {
      await (Branch as DocNode).sub(Customers).doc(instance.id).save(data);
    }
    toast.success(
      `Customer was ${instance ? 'updated' : 'created'} succesfully.`
    );
    return;
  };

  return (
    <DynamicForm
      instance={instance}
      schema={customerSchema}
      metadata={{ defaultDiscount: { hidden: true } }}
      onSubmit={handleCreateCustomer}
    />
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  CustomerForm
);

export async function fieldValueExists({
  collection,
  value,
  fieldName,
}: {
  collection: CollectionReference;
  fieldName: string;
  value: any;
}) {
  const qr = query(collection, where(fieldName, '==', value));
  const result = await getDocs(qr);
  return result.size > 0;
}
