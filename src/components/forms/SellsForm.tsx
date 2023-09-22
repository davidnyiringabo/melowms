import React from "react";
import { z } from "zod";
import { useCustomAuth } from "../../context/Auth";
import { useFirestore } from "reactfire";
import DynamicForm from "./Form";
import { Customers, DocNode, Sells } from "../../database";
import CustomerForm from "./sales/CustomerForm";
import withAuthorization from "../hocs/withAuthorization";

const SellsForm = ({
  instance,
  onCreated,
}: {
  instance?: any;
  onCreated: (id: string) => void;
}) => {
  const schema = z.object({
    customer: z.string().min(1).describe("query"),
    customerName: z.string().min(1),
    dateSold: z.date().default(new Date()),
    confirmed: z.literal(false),
    saved: z.literal(false),
    canceled: z.literal(false),
  });
  const { isAdmin, tinnumber, Branch, isManager } = useCustomAuth();
  const firestore = useFirestore();
  const customersQuery = Branch?.sub(Customers).ref;
  const handleSaveSells = async (data: any) => {
    const sellsQuery = (Branch as DocNode).sub(Sells);
    if (instance) {
      await sellsQuery.doc(instance.id).save(data);
      onCreated(instance.id);
    } else {
      let doc = await sellsQuery.addDoc({
        ...data,
        totalItems: 0,
        totalTax: 0,
        caution: 0,
        totalPaid: 0,
        totalCost: 0,
      });
      onCreated(doc.id);
    }
  };
  return (
    <DynamicForm
      instance={instance}
      schema={schema}
      metadata={{
        customerName: {
          hidden: true,
        },
        customer: {
          label: "",
          query: customersQuery,
          canSearchQuery: true,
          display: "name",
          value: "id",
          addForm: <CustomerForm />,
          getUpdateForm: (instance) => <CustomerForm instance={instance} />,
          onSelect(record, setValue) {
            setValue("customerName", record.name);
          },
        },
      }}
      onSubmit={handleSaveSells}
    />
  );
};
export default withAuthorization({
  requiredClaims: { superAdmin: false, manager: true, admin: true },
  all: false,
})(SellsForm);
