import React from 'react';
import { z } from 'zod';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';

export const replaceInvoiceSchema = z.object({
  orderNumber: z.string().min(1),
});

const ReplaceInvoiceForm = ({
  replaceInvoice,
}: {
  replaceInvoice: SubmitHandler<z.infer<typeof replaceInvoiceSchema>>;
}) => {
  return (
    <DynamicForm
      schema={replaceInvoiceSchema}
      metadata={{ orderNumber: { label: 'newOrderNumber' } }}
      onSubmit={replaceInvoice}
    />
  );
};

export default ReplaceInvoiceForm;
