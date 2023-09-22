import DynamicForm from "../Form";
import { PropsWithPartialInstace, SupplierEmptiesReturn } from "../../../types";

const SupplierEmptiesReturnForm = ({
  instance,
  schema,
  metadata,
  handleSave,
}: {
  instance?: PropsWithPartialInstace<SupplierEmptiesReturn>;
  schema: any;
  metadata?: any;
  handleSave: any;
}) => {
  return (
    <DynamicForm
      schema={schema}
      instance={instance}
      onSubmit={handleSave}
      metadata={metadata}
    />
  );
};

export default SupplierEmptiesReturnForm;
