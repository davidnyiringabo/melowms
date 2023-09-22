import { DocumentReference, Timestamp, doc, setDoc } from 'firebase/firestore';
import React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { useFirestore } from 'reactfire';
import { z } from 'zod';
import { fieldValueExists } from './sales/CustomerForm';
import toast from 'react-hot-toast';
import DynamicForm from './Form';

const ivNumberSchema = z.object({
  invoiceNumber: z.string().min(1),
});

const AddInvoiceNumberForm = ({
  invoiceRef,
}: {
  invoiceRef: DocumentReference;
}) => {
  const handleUpdateInvoice: SubmitHandler<
    z.infer<typeof ivNumberSchema>
  > = async (data) => {
    const parentRef = invoiceRef.parent;
    const invoiceNumberExists = await fieldValueExists({
      collection: parentRef,
      fieldName: 'invoiceNumber',
      value: data.invoiceNumber,
    });
    if (invoiceNumberExists) {
      toast.error(
        `Order with invoice number "${data.invoiceNumber}" already exists!`
      );
      return Promise.reject();
    }

    await setDoc(
      invoiceRef,
      { invoiceNumber: data.invoiceNumber, updatedTime: Timestamp.now() },
      {
        merge: true,
      }
    );
  };
  return <DynamicForm onSubmit={handleUpdateInvoice} schema={ivNumberSchema} />;
};

export default AddInvoiceNumberForm;
