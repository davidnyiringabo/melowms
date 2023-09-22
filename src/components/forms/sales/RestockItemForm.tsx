import { z } from 'zod';
import DynamicForm from '../Form';
import {
  PropsWithInstace,
  TransferItem,
  TransferItemReject,
} from '../../../types';
import { useViewTransfer } from '../../../context/ViewTransferContext';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const restockItemSchema = z.object({ items: z.array(z.any()).min(1) });

const RestockItemForm = ({
  instance,
}: PropsWithInstace<unknown, TransferItem>) => {
  const { restockQuantity } = useViewTransfer();

  const handleRestock: SubmitHandler<
    z.infer<typeof restockItemSchema>
  > = async (data) => {
    const indexes = data.items.map((idx) => Number(idx));
    const quantity = (instance.rejected as TransferItemReject[]).reduce(
      (acc, rj, i) => acc + (indexes.includes(i) ? rj.qty : 0),
      0
    );
    return restockQuantity(
      instance,
      quantity,
      indexes.map((idx) => Number(idx))
    )
      .then((done) => true)
      .catch((err) => {
        toast.error(err.message);
        return Promise.reject(err);
      });
  };

  const optionChoices = (instance.rejected as TransferItemReject[]).map(
    (rj, i) => [`${rj.reason} - ${rj.qty}`, i]
  );

  return (
    <DynamicForm
      schema={restockItemSchema}
      metadata={{
        items: {
          multiple: true,
          options: optionChoices,
        },
      }}
      onSubmit={handleRestock}
    />
  );
};

export default RestockItemForm;
