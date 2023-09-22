import { z } from "zod";
import DynamicForm from "./Form";
import { SubmitHandler } from "react-hook-form";
import { useCustomAuth } from "../../context/Auth";
import ItemsCreateForm from "./ItemsCreateForm";
import { Customers, DamagedProducts, DocNode, Items } from "../../database";
import CustomerForm from "./sales/CustomerForm";
import { useFirestore } from "reactfire";

// action: 'Transfer',
// toBranch: ourData.toBranch,
// to: ourData.to,
// quantity: damagedQuantity,
// items: damages,
// transfer: ourTDoc.id,
// item: item.item,
// itemName: item.itemName,

const DamagesForm = ({ instance }: { instance?: any }) => {
  const schema = z.object({
    item: z.string().min(1).describe("query"),
    itemName: z.string().min(1),
    action: z.string().min(1),
    quantity: z.number(),
    approved: z.literal(false),
    date: z.date().default(new Date()),
  });

  const { Branch } = useCustomAuth();

  const handleSubmit: SubmitHandler<z.infer<typeof schema>> = async (
    data: any
  ) => {
    const returns = (Branch as DocNode).sub(DamagedProducts);
    if (instance) {
      data.approved = true;
      return returns.doc(instance.id).save(data);
    }
    return returns.addDoc(data);
  };

  const itemsQuery = Items.ref;
  const customersQuery = Branch?.sub(Customers).ref;

  return (
    <DynamicForm
      instance={instance}
      schema={schema}
      onSubmit={handleSubmit}
      metadata={{
        action: { label: "Cause of damage" },
        itemName: { hidden: true },
        item: {
          query: itemsQuery,
          label: "",
          canSearchQuery: true,
          display: "name",
          addForm: <ItemsCreateForm />,
          getUpdateForm(instance) {
            return <ItemsCreateForm instance={instance} />;
          },
          value: "id",
          onSelect(record, setValue) {
            setValue("itemName", record.name);
          },
        },
      }}
    />
  );
};

export default DamagesForm;
