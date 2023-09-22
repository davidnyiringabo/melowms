import { useCustomAuth } from '../../context/Auth';
import { DocNode, Inventory } from '../../database';
import { InventoryAction, InventoryItem, PropsWithInstace } from '../../types';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import withAuthorization from '../hocs/withAuthorization';
import { toast } from '../ToasterContext';
import DynamicForm from './Form';

const InventorySchema = z.object({
  unitPrice: z.number().multipleOf(0.01).min(0),
});

type InventorySchemaType = z.infer<typeof InventorySchema>;

const InventoryCreateForm = ({
  instance,
}: PropsWithInstace<unknown, InventoryItem>) => {
  const { Branch } = useCustomAuth();

  const handleUpdateInventory: SubmitHandler<InventorySchemaType> = async (
    data
  ) => {
    return (Branch as DocNode)
      .sub(Inventory)
      .doc(instance.id)
      .save({ ...data, lastChange: 0, lastAction: InventoryAction.Normal })
      .then(() =>
        toast.success(`Inventory for ${instance.itemName} was updated!`)
      )
      .catch((err) => {
        toast.error(err.message);
        return Promise.reject();
      });
  };

  return (
    <DynamicForm onSubmit={handleUpdateInventory} schema={InventorySchema} />
  );
};

export default withAuthorization({ requiredClaims: {} })(InventoryCreateForm);
