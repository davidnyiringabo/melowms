import { useEffect } from 'react';
import { z } from 'zod';
import DynamicForm from '../Form';
import { PropsWithPartialInstace, RefineCallback } from '../../../types';
import { SubmitHandler } from 'react-hook-form';
import withAuthorization from '../../hocs/withAuthorization';
import { useModalContext } from '../../../context/ModalContext';
import { CalcFunction } from '../../../context/DynamicFormContext';

const fillablesSchema = z.object({
  maxAllowed: z.number().min(0).default(0),
  provided: z.number().min(0).default(0),
  returned: z.number().min(0).default(0),
  allowedNow: z.number().default(0),
});

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
  instance,
  onSave,
}: PropsWithPartialInstace<{
  onSave: SubmitHandler<z.infer<typeof fillablesSchema>>;
}>) => {
  const { changeTitle, handleClose } = useModalContext();

  useEffect(() => {
    changeTitle('Branch fillables');
  }, []);

  const handleSubmit: SubmitHandler<z.infer<typeof fillablesSchema>> = async (
    data
  ) => {
    try {
      data.provided = data.provided - data.returned;
      data.returned = 0;
      await onSave(data);
      handleClose();
    } catch (error) {
      return Promise.reject(error);
    }
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
      ]}
      schema={fillablesSchema}
      action={'Confirm'}
      onSubmit={handleSubmit}
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
