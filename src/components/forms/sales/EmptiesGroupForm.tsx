import React from 'react';
import z from 'zod';
import DynamicForm from '../Form';
import { DocNode, FillableGroups, Items } from '../../../database';
import ItemsCreateForm from '../ItemsCreateForm';
import { SubmitHandler } from 'react-hook-form';
import { useCustomAuth } from '../../../context/Auth';
import { PropsWithPartialInstace } from '../../../types';
import { getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useModalContext } from '../../../context/ModalContext';

const emptiesGrouSchema = z.object({
  groupName: z.string().min(3),
  items: z.array(z.string()).min(1).max(10).describe('query'),
  maxAllowed: z.number().min(0).default(0),
  // provided: z.number().min(0).default(0),
  // returned: z.number().min(0).default(0),
  // allowedNow: z.number().default(0),
});

const EmptiesGroupForm = ({ instance }: PropsWithPartialInstace) => {
  const itemsQuery = Items.ref;
  const { Branch } = useCustomAuth();
  const { handleClose } = useModalContext();

  const handleCreateFillableGroup: SubmitHandler<
    z.infer<typeof emptiesGrouSchema>
  > = async (data) => {
    const colRef = (Branch as DocNode).sub(FillableGroups).ref;

    const checkItemsQuery = query(
      colRef,
      where('items', 'array-contains-any', data.items)
    );
    const snap = await getDocs(checkItemsQuery);
    const firstDoc = snap.docs[0];

    const overlaps = firstDoc && firstDoc.id !== (instance as any)?.id;

    if (overlaps) {
      toast.error(
        'On of the selected items, exist in another group. Find it and remove it there, or remove it here to continue.'
      );
      return Promise.reject();
    }

    if (!instance) {
      await (Branch as DocNode).sub(FillableGroups).addDoc(data);
    } else {
      await (Branch as DocNode).sub(FillableGroups).doc(instance.id).save(data);
    }
    toast.success(
      `Fillable group "${data.groupName}" was ${
        instance ? 'updated' : 'created'
      }.`
    );
    handleClose();
  };

  return (
    <DynamicForm
      onSubmit={handleCreateFillableGroup}
      instance={instance}
      schema={emptiesGrouSchema}
      action={'Save'}
      metadata={{
        maxAllowed: { label: 'Default Max allowed' },
        items: {
          canSearchQuery: true,
          multiple: true,
          display: 'name',
          addForm: <ItemsCreateForm />,
          getUpdateForm: (instance) => <ItemsCreateForm instance={instance} />,
          query: itemsQuery,
        },
      }}
    />
  );
};

export default EmptiesGroupForm;
