import React from "react";
import withAuthorization from "../hocs/withAuthorization";
import { CheckedDamagedProducts, DocNode, Items } from "../../database";
import { useCustomAuth } from "../../context/Auth";
import DynamicForm from "./Form";
import { z } from "zod";
import ItemsCreateForm from "./ItemsCreateForm";

const NewDamagedItem = ({
  instance,
  damagedId,
}: {
  instance?: any;
  damagedId: string;
}) => {
  const { Branch } = useCustomAuth();
  const checkedDamagedEmptiesQuery = (Branch as DocNode).sub(
    CheckedDamagedProducts
  );
  
  const schema = z.object({
    item: z.string().describe("query"),
    itemName: z.string(),
    causeOfDamage: z.string().min(1),
    quantity: z.number().min(1),
    dateChecked: z.date().default(new Date()),
  });
  const handleSubmit = (data: any) => {
    if (instance) {
      return checkedDamagedEmptiesQuery.doc(instance.id).save(data);
    }
    data.damageId = damagedId;
    return checkedDamagedEmptiesQuery.addDoc(data);
  };
  return (
    <DynamicForm
      instance={instance}
      schema={schema}
      onSubmit={handleSubmit}
      metadata={{
        itemName: {
          hidden: true,
        },
       
        item: {
          query: Items.ref,
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

export default withAuthorization({
  requiredClaims: { superAdmin: false, manager: true, admin: true },
  all: false,
})(NewDamagedItem);
