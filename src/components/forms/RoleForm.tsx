import { useCustomAuth } from '../../context/Auth';
import { useEffect, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { useFirestoreDocData } from 'reactfire';
import * as z from 'zod';
import Spinner from '../Spinner';
import DynamicForm from './Form';
import { DefaultRoles, Permissions } from '../../database';
import { PropsWithPartialInstace } from '../../types';

const RoleSchema = z.object({
  name: z.string().min(3),
  permissions: z.array(z.string()).min(1),
  description: z.string().min(5).describe('textarea'),
});

const RoleForm = ({ instance }: PropsWithPartialInstace) => {
  const [permissions, setPermissions] = useState<string[]>([]);

  const { status, data: perms } = useFirestoreDocData(
    Permissions.doc('perms0').ref,
    {
      idField: 'id',
    }
  );

  useEffect(() => {
    if (!perms) return;
    setPermissions(perms.permissions as string[]);
  }, [perms]);

  const handleCreateRole: SubmitHandler<z.infer<typeof RoleSchema>> = async (
    data
  ) => {
    if (!instance)
      await DefaultRoles.addDoc({
        name: data.name,
        permissions: data.permissions,
        description: data.description,
      });
    else
      await DefaultRoles.doc(instance.id as string).save({
        name: data.name,
        permissions: data.permissions,
        description: data.description,
      });
  };

  const optionChoices = permissions.map((perm) => {
    return [perm, perm];
  });
  return permissions.length > 0 ? (
    <DynamicForm
      instance={instance}
      schema={RoleSchema}
      metadata={{
        permissions: {
          multiple: true,
          options: optionChoices,
        },
      }}
      onSubmit={handleCreateRole}
    />
  ) : (
    <></>
  );
};

export default RoleForm;
