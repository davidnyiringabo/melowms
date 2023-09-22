import {
  MdArrowRightAlt,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdEdit,
  MdPadding,
  MdShoppingBasket,
  MdVerified,
} from "react-icons/md";
import { useSalesContext } from "../../context/SalesContext";
import toRwf from "../../helpers/toRwf";
import { Customer, OrderItem } from "../../types";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import ConfirmCartForm from "../forms/sales/ConfirmCartForm";
import AddToCartForm from "../forms/sales/AddToCartForm";
import OrderCustomers, { OrderBranches } from "./OrderCustomers";
import { useModalContext } from "../../context/ModalContext";
import Spinner from "../Spinner";
import { toast } from "react-hot-toast";
import { useCustomAuth } from "../../context/Auth";
import { DocNode, EmptiesStock } from "../../database";
import { getDocs, query, where } from "firebase/firestore";

const OrderCart = () => {
  const {
    customer,
    branch,
    isTransfer,
    removeOrderItem,
    orderItemsCost,
    handleClearCart,
    orderItems,
  } = useSalesContext();
  const [instance, setInstance] = useState<OrderItem>();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex border order-cart rounded flex-col w-full h-full">
      {
        <Modal
          title={`Choose ${isTransfer ? "Branch" : "Customer"}`}
          open={open}
          onClose={() => setOpen(false)}
        >
          {open ? isTransfer ? <OrderBranches /> : <OrderCustomers /> : <></>}
        </Modal>
      }
      {!!instance && (
        <Modal
          onClose={() => setInstance(undefined)}
          open={!!instance}
          title={`Add "${instance?.itemName}" to cart`}
        >
          {instance && (
            <AddToCartForm replace={true} instance={instance as OrderItem} />
          )}
        </Modal>
      )}
      <h3
        className={`flex items-center gap-3 justify-between stext-blue-900 bg-blue-200/70  ${
          isTransfer ? "bg-blue-400 " : " bg-blue-600"
        } font-bold border-b p-1 text-white gap-3`}
      >
        <span className="inline-flex items-center gap-1">
          <MdShoppingBasket className="w-6 h-6 ml-2" /> Cart
        </span>
        <button
          onClick={handleClearCart}
          className="btn py-1 bg-red-400 hover:bg-red-600 px-2"
        >
          <MdDelete /> Clear Cart
        </button>
      </h3>
      <div className="flex justify-between items-center gap-3 p-2 border-y">
        <div className="flex gap-2 items-center">
          <span className="font-bold">
            {isTransfer ? `Branch` : `Customer`}:{" "}
          </span>
          <span className=" px-2 py-1 text-sm font-bold flex gap-2 items-center border rounded-lg bg-blue-100">
            {isTransfer
              ? `${branch?.name ?? ""}`
              : customer?.name
              ? `${customer.name}${
                  customer?.tinnumber ? ` (${customer.tinnumber})` : ""
                }`
              : ""}

            {!(isTransfer ? branch?.name : customer?.name) && (
              <button
                onClick={() => setOpen(true)}
                className="btn bg-gray-100 text-blue-500 py-1"
              >
                Choose <MdArrowRightAlt />
              </button>
            )}

            {(isTransfer ? branch?.name : customer?.name) && (
              <button
                onClick={() => setOpen(true)}
                type="button"
                title="Change"
                className="border-2 hover:text-white hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-1 h-6 flex items-center justify-center w-6"
              >
                <MdEdit className="text-sm" />
              </button>
            )}
          </span>
        </div>
        {((customer?.emptiesBalance || (branch as any)?.emptiesBalance) ?? 0) >
          0 && (
          <div className="font-bold bg-blue-100 p-2 rounded py-[.3rem] text-sm ">
            Emballage Taken{" "}
            <span
              className={`${
                ((customer?.emptiesBalance ||
                  (branch as any)?.emptiesBalance) ??
                  0) > 0
                  ? "text-red-600"
                  : ""
              } font-bold text-base p-1 border px-2 rounded bg-blue-50 `}
            >
              {customer?.name
                ? customer.emptiesBalance ?? "0"
                : (branch as any)?.emptiesBalance ?? "0"}
            </span>
          </div>
        )}
        <div className="flex items-center">
          <span className="font-bold">Total: </span>
          <span className="font-mono font-extrabold ml-2 px-2 py-1 border rounded-lg bg-blue-100">
            {toRwf(orderItemsCost ?? 0)}
          </span>
        </div>
      </div>
      <div className="flex-1 flex w-full flex-col p-[5px]">
        <table>
          <thead className="border-b">
            <tr>
              <th className="text-start">
                <span className="font-semibold"></span>
              </th>
              <th className="border-1 text-xs font-bold rounded p-2">Qty</th>
              <th className="border-1 font-mono  text-xs font-bold rounded p-2">
                Price
              </th>
              <th className="border-1 font-mono  text-xs font-bold rounded p-2">
                Tot.Amnt
              </th>
              <th>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    title="Change"
                    className="border-1 text-xs hover:text-white hover:border-blue-500 border-blue-400 text-blue-500 font-bold rounded px-1 flex items-center justify-center"
                  >
                    Edit
                  </button>
                </div>
              </th>
              <th>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    title="Remove"
                    className="border-1 text-xs hover:text-white hover:bg-red-500 border-red-400 text-red-500 font-bold rounded px-1 flex items-center justify-center"
                  >
                    Delete
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="">
            {orderItems.length === 0 && (
              <tr className="[all:unset] p-[1rem!important] [display:flex!important] [justify-items:center] my-[.5rem!important] mx-[auto!important]  items-center font-light text-lg text-center w-[100%!imporant] ">
                <td colSpan={6}>
                  No items in the cart. Select from the left side.
                </td>
              </tr>
            )}
            {orderItems.map((oi) => (
              <tr className="border-b" key={oi.item}>
                <td>
                  <div className="flex gap-1 p-1 items-center">
                    <MdPadding />
                    <span className="font-semibold">{oi.itemName}</span>
                  </div>
                </td>
                <td className="text-center font-bold rounded p-2">
                  {oi.quantity}
                </td>
                <td className="text-center font-mono font-bold rounded p-2">
                  {toRwf(oi.unitPrice)}
                </td>
                <td className="text-center font-mono font-bold rounded p-2">
                  {toRwf(oi.totalPrice)}
                </td>
                <td>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setInstance(oi)}
                      type="button"
                      title="Change"
                      className="text-center hover:text-white justify-self-center self-center hover:bg-blue-500 border-blue-400 text-blue-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                    >
                      <MdEdit className="w-20 h-20" />
                    </button>
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => removeOrderItem(oi)}
                      type="button"
                      title="Remove"
                      className="text-center hover:text-white self-center justify-self-center hover:bg-red-500 border-red-400 text-red-500 font-bold text-xl rounded-full p-2 h-8 flex items-center justify-center w-8"
                    >
                      <MdClose className="w-20 h-20" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="my-1 flex flex-col justify-between text-xs">
        <CartConfirm />
      </div>
    </div>
  );
};

export default OrderCart;

export function CartConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const { Branch } = useCustomAuth();
  const {
    customer,
    branch,
    isTransfer,
    removeOrderItem,
    orderItemsCost,
    handleClearCart,
    orderItems,
    willPayCaution,
    setWillPayCaution,
    setCustomerEmpties,
  } = useSalesContext();
  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);
  const [message, setMessage] = useState<string>();
  const { handleClose } = useModalContext();
  return (
    <div className="flex justify-between items-center gap-2 ">
      {isOpen && (
        <Modal
          title="Confirm Cart Info"
          open={isOpen}
          onClose={() => setIsOpen(false)}
        >
          {isTransfer ? <TansferConfirm /> : <ConfirmCartForm />}
        </Modal>
      )}
      <Modal
        open={!!message}
        title="Customer's Empties"
        onClose={() => {
          setMessage(undefined);
        }}
      >
        <div className="flex flex-col gap-2 p-2">
          <p className="text-lg font-semibold max-w-[20rem]">{message}</p>
          <div className="flex items-center">
            <button
              onClick={() => {
                handleClose();
                setMessage(undefined);
              }}
              className="btn bg-red-500 hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              className="btn bg-green-500 hover:bg-green-600"
              onClick={() => {
                setIsOpen(true);
                handleClose();
                setMessage(undefined);
                setWillPayCaution(true);
              }}
            >
              Will Pay Caution
            </button>
          </div>
        </div>
      </Modal>
      <div className="flex w-full border-y bg-gray-100 justify-between items-center gap-2 ">
        {orderItems.length > 0 && customer && (
          <button
            onClick={async () => {
              const newQuery = query(
                emptiesStockQuery.ref,
                where("customer", "==", customer.id)
              );
              const docs = await getDocs(newQuery);
              const emptiesStock = docs.docs.map((doc) => doc.data());
              if (emptiesStock.length === 0) {
                setMessage(`${customer.name} has not brought any empties`);
                return;
              }
              // const quantity = emptiesStock.reduce(
              //   (prev, curr: any) => prev + curr.returnedQty
              // );
              let quantity = emptiesStock.reduce(
                (acc, curr) => acc + curr.returnedQty,
                0
              );
              setCustomerEmpties(quantity)
              if (quantity === 0) {
                setMessage(`${customer.name} has not brought any empties`);
                return;
              }
              let totalOrder = orderItems.reduce(
                (acc, curr) => acc + curr.quantity,
                0
              );
              if (totalOrder > quantity) {
                setMessage(
                  `${customer.name} has brought ${quantity} empties only which doesn't match ${totalOrder} empties`
                );
                return;
              }
              setIsOpen(true);
            }}
            className="btn m-2 "
          >
            {isTransfer ? "Transfer" : "Finish"} <MdCheckCircle />
          </button>
        )}
        <div className="flex text-lg gap-3 flex-wrap mr-2 items-center">
          <div className="flex items-center">
            <span className="font-semibold">Total: </span>
            <span className="font-mono font-bold ml-2 px-2 py-1 border rounded-lg bg-blue-50">
              {toRwf(orderItemsCost ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TansferConfirm() {
  const [open, setOpen] = useState(false);
  const { totalQuantity, handleConfirmTransfer, checkBranchFillables, branch } =
    useSalesContext();
  const { handleClose } = useModalContext();
  const [canTransfer, setCanTransfer] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!branch || Object.keys(branch).length === 0) setOpen(true);
  }, [branch]);

  useEffect(() => {
    checkBranchFillables().then(([canSave, msg]) => {
      setCanTransfer(canSave);
      setMsg(msg ?? "");
    });
  }, [checkBranchFillables, totalQuantity, branch]);

  const confirmParam = {
    loading: (
      <div className="flex items-center gap-2 p-1">
        <span className="text-gray-500">Confirming Transfer...</span>
      </div>
    ),
    success: () => {
      setOpen(false);
      handleClose();
      return "Transfer was applied succesfully!";
    },
    error: (e: any) => (
      <div className="flex gap-2 p-1 flex-col">
        <p>Error occured, Transfer was not completed.</p>
        <p className="text-red-500 test-sm">{e?.message}</p>
      </div>
    ),
  };

  return (
    <>
      {open && (
        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          title="Choose Branch"
        >
          <OrderBranches />
        </Modal>
      )}

      <div className="p-2">
        {!canTransfer && !msg && <Spinner />}
        {!canTransfer && msg && (
          <div className="flex border bg-red-300/30 mx-auto max-w-[400px] rounded p-3 gap-2 flex-col my-5 text-lg font-semibold">
            <span className="text-xl mb-3 text-red-700 font-bold capitalize">
              Attention{" "}
            </span>
            <p className=" text-red-500 ">{msg}</p>
          </div>
        )}
        {canTransfer && (
          <>
            <p className="text-lg my-3">
              You're about to tansfer "{totalQuantity}" quantities to "
              {branch?.name} "
            </p>

            <button
              onClick={() => {
                toast.promise(handleConfirmTransfer(), confirmParam);
              }}
              className="btn bg-green-500 hover:bg-green-600"
            >
              Confirm <MdVerified />
            </button>
          </>
        )}
      </div>
    </>
  );
}
