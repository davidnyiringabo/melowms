import { z } from 'zod';
import DynamicForm from '../Form';
import { PropsWithInstace, TransferItem } from '../../../types';
import { MdClose } from 'react-icons/md';
import { useViewTransfer } from '../../../context/ViewTransferContext';
import { SubmitHandler } from 'react-hook-form';
import { useModalContext } from '../../../context/ModalContext';

const rejectItemSchema = z.object({
  quantity: z.number().min(1),
  reason: z.enum(['Damaged', 'Mismatch', 'Over Stock', 'Other']),
  description: z.string().describe('textarea'),
});

const RejectItemsForm = ({
  instance,
}: PropsWithInstace<unknown, TransferItem>) => {
  const { rejectQuantity } = useViewTransfer();
  const { handleClose } = useModalContext();

  const handleReject: SubmitHandler<z.infer<typeof rejectItemSchema>> = async (
    data
  ) => {
    await rejectQuantity(instance, {
      desc: data.description,
      qty: data.quantity,
      reason: data.reason,
    });
    handleClose();
  };

  return (
    <DynamicForm
      schema={rejectItemSchema.extend({
        quantity: z
          .number()
          .min(1)
          .max(instance.untouchedQty ?? instance.quantity),
      })}
      action={
        <>
          <MdClose /> Confirm Reject
        </>
      }
      className={`bg-red-500 hover:bg-red-700`}
      onSubmit={handleReject}
      instance={{ quantity: (instance.untouchedQty ?? instance.quantity) || 0 }}
    />
  );
};

export default RejectItemsForm;
