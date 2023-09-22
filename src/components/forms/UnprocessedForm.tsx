import { z } from "zod";
import DynamicForm from "./Form";
import { SubmitHandler } from "react-hook-form";
import { Customer, PropsWithInstace } from "../../types";
import { useCustomAuth } from "../../context/Auth";
import { DocNode, EmptiesStock } from "../../database";

const schema = z.object({
  count: z.number().min(0).default(0),
  dateReturned: z.date().default(new Date()),
});

const UnprocessedForm = ({
  instance: customer,
}: PropsWithInstace<unknown, Customer>) => {
  const { Branch } = useCustomAuth();
  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);

  const handleSubmit: SubmitHandler<z.infer<typeof schema>> = async (data) => {
    await emptiesStockQuery.addDoc({
      customer: customer.id,
      customerName: customer.name,
      returnedQty: data.count,
      dateReturned: data.dateReturned,
    });
    return;
  };
  return (
    <DynamicForm
      schema={schema}
      onSubmit={handleSubmit}
      metadata={{ count: { label: "Number of emballage(Empties)" } }}
    />
  );
};

export default UnprocessedForm;
