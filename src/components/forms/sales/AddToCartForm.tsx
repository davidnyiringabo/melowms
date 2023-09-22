import { useEffect, useState } from "react";
import DynamicForm from "../Form";
import { z } from "zod";
import { SubmitHandler } from "react-hook-form";
import { useSalesContext } from "../../../context/SalesContext";
import { InventoryItem, OrderItem } from "../../../types";
import { MdAdd, MdEdit } from "react-icons/md";
import { useModalContext } from "../../../context/ModalContext";
import { useFirestoreDocData } from "reactfire";
import { useCustomAuth } from "../../../context/Auth";
import withAuthorization from "../../hocs/withAuthorization";
import { DocNode, EmptiesStock, Inventory } from "../../../database";
import Spinner from "../../Spinner";
import { DocumentReference, query, where } from "firebase/firestore";

const addToCartSchema = z.object({
  quantity: z.number().min(1).default(0),
  discount: z.number().min(0).max(100).step(0.01).default(0),
});

const AddToCartForm = ({
  replace = false,
  instance,
}: {
  replace?: boolean;
  instance: OrderItem;
}) => {
  const { Branch } = useCustomAuth();
  const { orderItems, replaceOrderItem, addOrderItem } = useSalesContext();
  const { changeTitle, handleClose } = useModalContext();

  const { data: inventory, status } = useFirestoreDocData<InventoryItem>(
    (Branch as DocNode).sub(Inventory).doc(instance.item)
      .ref as DocumentReference<InventoryItem>
  );

  useEffect(() => {
    changeTitle(`Add "${instance.itemName}" to cart`);
  }, []);

  const [open, setOpen] = useState(false);
  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);
  const handleAddToCart: SubmitHandler<z.infer<typeof addToCartSchema>> = (
    data
  ) => {
    // const newQuery = query(
    //   emptiesStockQuery.ref,
    //   where("customer")
    // )
    const totalPrice = Number((instance.unitPrice * data.quantity).toFixed(2));
    const totalAfterDiscount =
      totalPrice - Number(((totalPrice * data.discount) / 100).toFixed(2));
    const taxAmount =
      instance.taxCode === "B"
        ? ((totalPrice - (instance.nonTaxableAmount ?? 0) * data.quantity) *
            18) /
          118
        : 0;

    if (!replace && !orderItems.some((oi) => oi.item === instance.item)) {
      addOrderItem({
        ...instance,
        ...data,
        totalAfterDiscount,
        totalPrice,
        taxAmount,
        taxCode: instance.taxCode ?? "B",
      });
    } else {
      replaceOrderItem(instance, {
        ...instance,
        ...data,
        discount: data.discount ?? 0,
        totalPrice,
        totalAfterDiscount,
        taxAmount,
        taxCode: instance.taxCode ?? "B",
      });
    }

    handleClose();
  };

  return (
    <div className="flex flex-col gap-3">
      {status === "loading" && <Spinner />}
      {status === "success" && inventory && (
        <DynamicForm
          action={
            <>
              {!orderItems.some((oi) => oi.item === instance.item) ? (
                <>
                  <MdAdd /> Add to cart
                </>
              ) : (
                <>
                  <MdEdit /> Update cart
                </>
              )}{" "}
            </>
          }
          instance={orderItems.find((oi) => oi.item === instance.item)}
          schema={addToCartSchema.extend({
            quantity: z
              .number()
              .min(1)
              .max(
                inventory.quantity,
                `The quantity is more than available "${inventory.quantity}".`
              )
              .default(0),
          })}
          metadata={{
            discount: {
              helpText: "Percentage(%) discount for this product only.",
            },
          }}
          onSubmit={handleAddToCart}
        />
      )}
      {orderItems.some((oi) => oi.item === instance.item) && (
        <p className="max-w-[400px] mx-auto text-center font-bold text-sm text-blue-600">
          This will <span className="text-black">replace</span> the quantity &
          discount for{" "}
          <span className="font-semibold text-black">
            "{instance.itemName}"
          </span>{" "}
          in the cart.
        </p>
      )}
    </div>
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  AddToCartForm
);
