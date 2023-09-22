import { PropsWithInstace, TransferItem } from '../../../types';
import { z } from 'zod';
import DynamicForm from '../Form';
import { MdVerified } from 'react-icons/md';
import { useViewTransfer } from '../../../context/ViewTransferContext';
import { SubmitHandler } from 'react-hook-form';
import { useModalContext } from '../../../context/ModalContext';

const acceptItemSchema = z.object({
  quantity: z.number().min(1),
});

const AcceptItemForm = ({
  instance,
}: PropsWithInstace<unknown, TransferItem>) => {
  const { acceptQuantity } = useViewTransfer();
  const { handleClose } = useModalContext();
  const handleAccept: SubmitHandler<z.infer<typeof acceptItemSchema>> = async (
    data
  ) => {
    await acceptQuantity(instance, data.quantity);
    handleClose();
  };
  return (
    <DynamicForm
      schema={acceptItemSchema.extend({
        quantity: z
          .number()
          .min(1)
          .max(instance.untouchedQty ?? instance.quantity),
      })}
      action={
        <>
          <MdVerified /> Confirm Accept
        </>
      }
      onSubmit={handleAccept}
      metadata={{ quantity: { label: 'Accepted Quantity' } }}
      instance={{ quantity: (instance.untouchedQty ?? instance.quantity) || 0 }}
    />
  );
};

export default AcceptItemForm;
