import React, { useState } from "react";
import { useCustomAuth } from "../../context/Auth";
import Spinner from "../Spinner";
import Modal from "../Modal";
import toRwf from "../../helpers/toRwf";
import {
  MdAlarm,
  MdCheckCircle,
  MdClose,
  MdVerified,
  MdWarning,
} from "react-icons/md";
import { toDate } from "./Invoice";
import { useFirestore, useFirestoreDocData } from "reactfire";
import { DocNode, Sells } from "../../database";
import { DocumentReference } from "firebase/firestore";
import { useModalContext } from "../../context/ModalContext";

const SellsShow = ({ sells: initialSells }: { sells: any }) => {
  const [sells, setSells] = useState(initialSells);
  const { changeSize, handleClose } = useModalContext();

  const { tinnumber, company, Branch } = useCustomAuth();
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const sellsDoc = (Branch as DocNode).sub(Sells).doc(sells.id);
  const { data: sellsData, status: inStatus } = useFirestoreDocData(
    sellsDoc.ref as DocumentReference,
    {
      idField: "id",
    }
  );

const confirmSells = () => {}

  return (
    <div>
      {sells && open && (
        <Modal
          title={"Confirm Purchase"}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
        >
          <p className="text-lg font-semibold">
            Are you ready to confirm this purchase?
          </p>
          <p className="flex items-center border-b pb-1 font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
            <span className="font-bold">Total Cost: </span>{" "}
            <span className="font-mono">{toRwf(sells.totalCost ?? 0)}</span>
          </p>
          <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
            <span className="font-bold">Total Items: </span>{" "}
            <span className="font-mono">{sells.totalItems ?? 0}</span>
          </p>

          <p className="text-red-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
            <MdWarning />
            After you confirm, you can't edit this purchase.
          </p>
          {(sells.totalCost ?? 0) <= 0 && (
            <p className="text-red-500 p-2 rounded max-w-xs mx-auto bg-red-200/25  mt-5 text-sm font-bold">
              {" "}
              You can't save a purchase with no selected items. The total is
              zero.
            </p>
          )}
          {/* <div className="border-y my-1" /> */}

          {(status === "loading" || inStatus === "loading") && (
            <div className="flex justify-center p-2 items-center">
              <Spinner />
            </div>
          )}

          <div className="flex items-center">
            {inStatus !== "loading" && sells.totalItems && (
              <>
                <button
                  onClick={() => {
                    confirmSells();
                    handleClose();
                  }}
                  className="btn self-end bg-green-400 hover:bg-green-600"
                >
                  <MdVerified />
                  Confirm
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="btn bg-red-400 hover:bg-red-500"
                >
                  <MdAlarm /> Wait
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {/* <p className="text-blue-500 font-bold mb-2"><span className='text-md text-gray-600'>Invoince <span className='underline text-xs'>NO:</span></span> {invoice.invoiceNumber}</p> */}
      <div className="flex border-b pb-3 flex-col w-full items-start">
        {
          <div
            className={`mb-2 text-sm w-full font-bold ${
              sells.confirmed ? "text-green-500" : "text-red-400"
            } flex items-center gap-2`}
          >
            {sells.confirmed || sells.canceled ? (
              sells.canceled ? (
                <>
                  <MdClose /> Cancelled
                </>
              ) : (
                <>
                  <MdCheckCircle /> Confirmed
                </>
              )
            ) : (
              <div className="flex w-full justify-between gap-2">
                <span className="flex gap-1 items-center">
                  <MdClose /> Not yet confirmed
                </span>
                <div className="flex  gap-1">
                  {/* <InvoiceActions invoiceDoc={invoiceDoc} invoice={invoice} /> */}
                  <button
                    onClick={() => {
                      setOpen(true);
                    }}
                    className="btn self-end "
                  >
                    <MdVerified />
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      </div>
      {status !== "loading" || inStatus !== "loading" ? (
        <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Sold At </span>
            <span>{toDate(sells.createdTime).toLocaleString("en-rw")}</span>
            <span className="mr-2 font-bold">VAT </span>
            <span>{toRwf(sells.totalTax ?? 0)}</span>
            {/* <span className="mr-2 font-bold">Excise Duties </span>
            <span>{toRwf(exciseDuties)}</span> */}
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total Items </span>
            <span>{sells.totalItems ?? "Unknown"}</span>
            <span className="mr-2 font-bold">Total Cost (No VAT) </span>
            <span>{toRwf((sells.totalCost ?? 0) - (sells.totalTax ?? 0))}</span>
            {/* <span className="mr-2 font-bold">Total Cost (With VAT) </span>
            <span>{toRwf(invoice.totalCost ?? 0)}</span> */}
            <span className="mr-2 font-bold text-blue-500">
              Amount to be Paid{" "}
            </span>
            <span className="[background-color:rgb(59_130_246_/_var(--tw-bg-opacity))_!important] text-white">
              {toRwf(sells.totalCost)}
            </span>
          </div>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
};

export default SellsShow;
