import { useEffect } from "react";
import { z } from "zod";
import DynamicForm from "../Form";
import { useCustomAuth } from "../../../context/Auth";
import {
  Branch,
  Customer,
  EmptiesReturn,
  Fillable,
  PropsWithPartialInstace,
} from "../../../types";
import { useModalContext } from "../../../context/ModalContext";
import {
  BranchFillables,
  Customers,
  DocNode,
  EmptiesReturns,
  Items,
} from "../../../database";
import { SubmitHandler } from "react-hook-form";
import ItemsCreateForm from "../ItemsCreateForm";

const CustomerReturnsForm = ({
  instance,
  isBranch = false,
  updateInstance,
  customerOrBranch,
}: any) => {
  const { tinnumber, Branch } = useCustomAuth();
  const { changeTitle } = useModalContext();

  const itemsQuery = Items.ref;

  useEffect(() => {
    changeTitle("Returned Emballage");
  }, []);
  const returnsSchema = z.object({
    // returnedQty: z.number().min(1).step(1),
    item: z.string().min(1).describe("query"),
    itemName: z
      .string()
      .min(1)
      .default(instance?.itemName ?? ""),
    dateReturned: z.date(),
    returnedQty: z
      .number()
      .min(1)
      .step(1)
      .default(
        updateInstance ? updateInstance.returnedQty : instance?.returnedQty ?? 0
      ),
  });


  return (
    <DynamicForm
      instance={updateInstance}
      schema={returnsSchema}
      metadata={{
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
      onSubmit={() => {}}
    />
  );
};

export default CustomerReturnsForm;
