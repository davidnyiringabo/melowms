import React, { useState } from "react";
import { MdClose, MdDangerous, MdVerified, MdWarning } from "react-icons/md";
import { toDate } from "./Invoice";
import { query, where } from "firebase/firestore";
import { CheckedDamagedProducts, DocNode } from "../../database";
import Table from "../Table";
import { useCustomAuth } from "../../context/Auth";
import NewDamagedItem from "../forms/NewDamagedItem";
import { TotalCalc } from "../../context/TableContext";
import useCopy from "use-copy";
import { BsClipboard, BsDot } from "react-icons/bs";
import Modal from "../Modal";
import Spinner from "../Spinner";
import { useModalContext } from "../../context/ModalContext";

const DamagedItems = ({
  instance,
  handleSave,
}: {
  instance: any;
  handleSave: Function;
}) => {
  const [open, setOpen] = useState(false);
  const { Branch } = useCustomAuth();
  const [copied, copy, setCopied] = useCopy(instance.id);
  const checkedDamagedEmptiesQuery = (Branch as DocNode).sub(
    CheckedDamagedProducts
  );
  const { handleClose } = useModalContext();

  const [totalCheckedDamaged, setTotalCheckedDamaged] = useState(0);
  const damagedTotal: TotalCalc<any> = (data) => {
    const total = data.reduce(
      (curr: number, value: any) => curr + value.quantity,
      0
    );
    setTotalCheckedDamaged(total);
    return [
      {
        totalName: "Total Checked Damaged Empties",
        important: true,
        value: total,
      },
    ];
  };
  const CheckedDmagedEmpties = query(
    checkedDamagedEmptiesQuery.ref,
    where("damageId", "==", instance.id)
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <div>
      <Modal
        title={"Approve Damaged Empties"}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        {confirming ? (
          <div className="my-3 flex flex-col gap-3 items-center">
            <div>We are sorting items you selected.</div>
            <Spinner />
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold">
              Are you ready to approve these damages?
            </p>
            <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
              <span className="font-bold">Total Checked Damaged Empties: </span>{" "}
              <span className="font-mono">{totalCheckedDamaged}</span>
            </p>
            <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
              <span className="font-bold">
                Total Unsorted collected Empties:{" "}
              </span>{" "}
              <span className="font-mono">{instance.quantity}</span>
            </p>
            {instance.quantity - totalCheckedDamaged > 0 && (
              <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                <span className="font-bold">Total unlocated Empties: </span>{" "}
                <span className="font-mono">
                  {instance.quantity - totalCheckedDamaged}
                </span>
              </p>
            )}
            <p className="text-red-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
              <MdWarning />
              After you confirm, you can't edit this sort.
            </p>
            {totalCheckedDamaged === 0 && (
              <p className="text-red-500 p-2 rounded max-w-xs mx-auto bg-red-200/25  mt-5 text-sm font-bold">
                You can't sort with no checked damaged empties.
              </p>
            )}
            {totalCheckedDamaged !== instance.quantity && (
              <p className="text-red-500 flex font-light mb-2 gap-2 p-2 rounded max-w-md mx-auto bg-red-200/25  mt-5 text-sm">
                <MdDangerous className="text-2xl" />
                <span>
                  The <span className="font-bold">total empties</span> checked
                  to be damaged is <span className="font-bold">not equal</span>{" "}
                  damaged <span className="font-bold">empties</span>.
                </span>
              </p>
            )}

            {totalCheckedDamaged > 0 &&
              totalCheckedDamaged === instance.quantity && (
                <button
                  onClick={async () => {
                    setConfirming(true);
                    await handleSave();
                    setOpen(false);
                    handleClose();
                  }}
                  className="btn self-end mt-3  bg-green-400 hover:bg-green-600"
                >
                  <MdVerified />
                  Approve
                </button>
              )}
          </>
        )}
      </Modal>
      <div className="flex w-full justify-between gap-2">
        <span className="flex gap-1 text-red-500 items-center">
          <MdClose /> Not yet approved
        </span>
        <div className="flex  gap-1">
          <button
            onClick={() => {
              setOpen(true);
            }}
            className="btn self-end "
          >
            <MdVerified />
            Approve
          </button>
        </div>
      </div>
      <div className="flex my-2 bg-gray-400 text-white rounded-md font-semibold p-3 justify-between">
        <div>Sort id</div>
        <div className="flex items-center justify-center gap-1">
          <div>{copied ? "Copied" : renderId(instance.id)}</div>
          <button
            onClick={() => {
              copy();
              setTimeout(() => {
                setCopied(true);
              }, 3000);
            }}
          >
            <BsClipboard />
          </button>
        </div>
      </div>
      <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
        <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
          <span className="mr-2 font-bold">Sorted At </span>
          <span>
            {toDate(instance.dateSorted as any).toLocaleString("en-rw")}
          </span>
        </div>
        <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
        <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
          <span className="mr-2 font-bold">Total Damaged Empties </span>
          <span>{instance.quantity}</span>
        </div>
      </div>

      <Table
        query={CheckedDmagedEmpties}
        columns={["itemName", "quantity", "causeOfDamage", "dateChecked"]}
        cantView
        cantDelete={false}
        hasTotals
        totalCalc={damagedTotal}
        collectionName="Checked Damaged Empties"
        collectionSingular="Checked Damaged Empties"
        createForm={<NewDamagedItem damagedId={instance.id} />}
        getUpdateForm={(instance: any) => {
          return <NewDamagedItem instance={instance} damagedId={instance.id} />;
        }}
      />
    </div>
  );
};

export const renderId = (id: string) => {
  return "......" + id.slice(-4);
};

export default DamagedItems;
