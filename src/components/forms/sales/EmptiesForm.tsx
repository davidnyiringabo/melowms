import { useEffect } from 'react';
import { z } from 'zod';
import DynamicForm from '../Form';
import { PropsWithPartialInstace, RefineCallback } from '../../../types';
import { SubmitHandler } from 'react-hook-form';
import withAuthorization from '../../hocs/withAuthorization';
import { CustomerEmpties, DocNode } from '../../../database';
import { useModalContext } from '../../../context/ModalContext';
import { CalcFunction } from '../../../context/DynamicFormContext';

const fillablesSchema = z.object({
  maxAllowed: z.number().min(0).default(0),
  provided: z.number().min(0).default(0),
  returned: z.number().min(0).default(0),
  allowedNow: z.number().default(0),
});

const refineAllowedNow: RefineCallback<typeof fillablesSchema> = ({
  allowedNow,
  provided,
  returned,
  maxAllowed,
}) => {
  const num = (v: any) => (!Number.isNaN(v) ? Number(v) : 0);

  return allowedNow === num(maxAllowed) - num(provided) + num(returned);
};

const refineProvided: RefineCallback<typeof fillablesSchema> = (data) => {
  return !(data.maxAllowed < data.provided);
};
const refinedProvidedArgs = {
  message: "Provided can't be greater than max allowed",
  path: ['provided'],
};

const refineReturned: RefineCallback<typeof fillablesSchema> = (data) => {
  return data.returned <= data.provided;
};
const refinedReturnedArgs = {
  message: "Returned can't be greater than provided",
  path: ['returned'],
};

const FillablesForm = ({
  customerDoc,
  instance,
}: PropsWithPartialInstace<{ customerDoc: DocNode }>) => {
  const { changeTitle, handleClose } = useModalContext();

  useEffect(() => {
    changeTitle('Customer fillables');
  }, []);

  const handleAddFillable: SubmitHandler<
    z.infer<typeof fillablesSchema>
  > = async (data) => {
    data.provided = data.provided - data.returned;
    data.returned = 0;
    if (!instance) await customerDoc.sub(CustomerEmpties).addDoc(data);
    else await customerDoc.sub(CustomerEmpties).doc(instance.id).save(data);
    handleClose();
  };

  const calculateAllowedNow: CalcFunction<typeof fillablesSchema> = ({
    fields,
    setValue,
  }) => {
    const num = (v: any) => Number(v) || 0;
    const [maxAllowed, provided, returned] = fields;
    const newValue = num(maxAllowed) - num(provided) + num(returned);
    setValue('allowedNow', newValue);
  };

  return (
    <DynamicForm
      instance={instance}
      refineCallbacks={[
        { fn: refineProvided, args: refinedProvidedArgs },
        { fn: refineReturned, args: refinedReturnedArgs },
        // {
        //   fn: refineAllowedNow,
        //   args: { message: 'Incorrent calculations', path: ['allowedNow'] },
        // },
      ]}
      schema={fillablesSchema}
      action={'Confirm'}
      onSubmit={handleAddFillable}
      metadata={{
        provided: { label: 'Owed(To be returned)', disabled: true },
        allowedNow: {
          disabled: true,
          watchFields: ['maxAllowed', 'provided', 'returned'],
          calculate: calculateAllowedNow,
        },
      }}
    />
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  FillablesForm
);
