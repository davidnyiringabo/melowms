import React, { useEffect, useState } from "react";
import Table from "../../components/Table";
import { Orders } from "../../database";
import { query, collectionGroup, where } from "firebase/firestore";
import withAuthorization from "../../components/hocs/withAuthorization";
import { useCustomAuth } from "../../context/Auth";
import { useFirestore } from "reactfire";
import { Order, OrderItem } from "../../types";
import {
  MdPadding,
  MdEdit,
  MdClose,
  MdOpenInFull,
  MdMoney,
} from "react-icons/md";
import toRwf from "../../helpers/toRwf";
import { useSalesContext } from "../../context/SalesContext";
import Modal from "../../components/Modal";
import InvoiceGenerator from "../../components/sales/InvoicePDF";
import { TotalCalc } from "../../context/TableContext";
import { useModalContext } from "../../context/ModalContext";

const OrdersPage = () => {
  const { tinnumber, branch } = useCustomAuth();
  const ordersQuery = query(
    collectionGroup(useFirestore(), Orders.name),
    where("path.companies", "==", tinnumber),
    where("path.branches", "==", branch)
  );
  const { changeSize } = useModalContext();

  useEffect(() => {
    changeSize("xl");
  });

  const totalCalc: TotalCalc<Order> = (data) => {
    return [
      {
        totalName: "Total Quantity",
        value: data.reduce((a, c) => a + c.totalQuantity, 0),
      },
      {
        totalName: "Total Amount",
        value: data.reduce((a, c) => a + c.totalCost, 0),
        important: true,
      },
    ];
  };

  const [open, setOpen] = useState(false);
  const contents = (
    <Table
      query={ordersQuery}
      onShow={(instance: Order) => {
        return <OrderItems canModify={false} order={instance} />;
      }}
      hasTotals
      totalCalc={totalCalc}
      canRange
      cantUpdate
      cantDelete
      maxCreate={0}
      collectionName={"Sales"}
      defaultSearchField={"customerName"}
      columns={[
        "customerName",
        "totalQuantity",
        "totalItems",
        "discount",
        "totalCost",
        "costAfterDiscount",
        "caution",
        "status",
        "createdTime",
      ]}
        // transformData={(data) => {
        //   console.log(data)
        // }}
      createForm={undefined}
    />
  );
  return (
    <div className="flex max-h-full flex-col w-full">
      <h3
        className={`flex justify-between items-center stext-blue-900 bg-blue-200/70  bg-blue-600 font-bold border-b p-1 text-white gap-3`}
      >
        <span className="flex gap-2">
          <MdMoney className="w-6 h-6 ml-2" /> Sales
        </span>
        <button
          onClick={() => {
            setOpen(true);
          }}
          className="icon-button-filled flex gap-2 py-1 w-fit bg-blue-400 text-white border-blue-400"
        >
          <MdOpenInFull />
          Expand
        </button>
      </h3>
      {open && (
        <Modal
          title="Sales"
          size="xl"
          open={open}
          onClose={() => setOpen(false)}
        >
          {contents}
        </Modal>
      )}
      <div className="flex mt-1 justify-end"></div>
      {contents}
    </div>
  );
};

export default withAuthorization({ requiredClaims: { manager: true } })(
  OrdersPage
);

export function OrderItems({
  onSetInstance,

  canModify = true,
  order,
}: {
  onSetInstance?: Function;
  canModify?: boolean;
  order: Order;
}) {
  const { removeOrderItem } = useSalesContext();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    setOrderItems(order.items);
  }, [order]);

  return (
    <div className="flex flex-col gap-1 my-2 p-1">
      <InvoiceGenerator order={order} />
      {orderItems.map((oi) => (
        <div
          key={oi.item}
          className="border rounded px-3 bg-gray-200/60 flex justify-between items-center gap-2 p-2"
        >
          <div className="flex gap-2 items-center">
            <MdPadding />
            <span className="font-semibold">{oi.itemName}</span>
          </div>
          <div className="flex gap-2">
            <div className="border-2 font-bold rounded p-2 h-8 flex items-center justify-center">
              {oi.quantity}
            </div>
            <div className="border-2 font-mono  font-bold rounded p-2 h-8 flex items-center justify-center">
              {toRwf(oi.totalPrice)}
            </div>
            {canModify && (
              <>
                <button
                  onClick={() => onSetInstance && onSetInstance(oi)}
                  type="button"
                  title="Change"
                  className="border-2 hover:text-white hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                >
                  <MdEdit className="w-20 h-20" />
                </button>
                <button
                  onClick={() => removeOrderItem(oi)}
                  type="button"
                  title="Remove"
                  className="border-2 hover:text-white hover:bg-red-500 border-red-400 text-red-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                >
                  <MdClose className="w-20 h-20" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
