import { DocumentData, deleteDoc, doc } from "firebase/firestore";
import {
  CellTransform,
  ColCollection,
  useTableContext,
} from "../context/TableContext";
import {
  MdCheckBox,
  MdClose,
  MdEdit,
  MdDeleteForever,
  MdCancel,
  MdOpenInFull,
} from "react-icons/md";
import { useFirestore, useFirestoreDocData } from "reactfire";
import Spinner from "./Spinner";
import { toast } from "react-hot-toast";
import { useState } from "react";
import Modal from "./Modal";
import toRwf from "../helpers/toRwf";

export type TableRowProps<T = DocumentData> = {
  record: T;
};

const TableRow = <T extends DocumentData>({ record }: TableRowProps<T>) => {
  const [open, setOpen] = useState(false);
  const [dRecord, setDRecord] = useState<DocumentData & { _cref?: string }>();

  const {
    canSelectMultiple,
    handleSetUpdateInstance,
    handleSetViewInstance,
    handleSelectRecords,
    handleDeleteRecord,
    selectedIds,
    filteredData: data,
    deletedRecord,
    columnCollection,
    ...props
  } = useTableContext();

  const DisplayColumnQuery = ({
    coll,
    record,
  }: {
    coll: ColCollection;
    record: T;
  }) => {
    const docRef = coll.getCollection(record).doc(record[coll.column]).ref;
    const { data, status } = useFirestoreDocData(docRef);

    return status === "loading" ? <Spinner small /> : <>{data[coll.display]}</>;
  };
  const firestore = useFirestore();

  const handleDelete = async () => {
    if (!dRecord?._cref) return toast.error(`Can't delete the record.`);
    try {
      await deleteDoc(doc(firestore, dRecord._cref));
      deletedRecord && deletedRecord(dRecord);
      toast.success("Record was deleted successfully!");
    } catch (error: any) {
      toast.error(`Error: ${error.message ?? "Something went wrong"}`);
    }
  };

  return (
    <>
      <tr
        key={record.id}
        style={props.getRecordStyles ? props.getRecordStyles(record) : {}}
        onClick={function (e) {
          props.cantAct || props.cantView
            ? (canSelectMultiple || props.canSelect) &&
              handleSelectRecords(record)
            : !props.cantView && handleSetViewInstance(record);
        }}
        className={`bg-white border-t hover:bg-[rgb(147,197,253,.6)!important] ${
          props.getRecordClasses ? props.getRecordClasses(record) : ""
        }  `}
      >
        <Modal title="Delete Record" open={open} onClose={() => setOpen(false)}>
          <h4 className="text-3xl text-red-500">Confirm Delete?</h4>
          <p className="text-lg font-bold  my-5">
            <span className="block">
              This can lead to{" "}
              <span className="font-extrabold text-red-600">data loss</span>.{" "}
            </span>
            Please make sure you{" "}
            <span className="font-extrabold text-red-600">don't need </span>
            these information.
          </p>
          <div className="flex my-2">
            <button
              type="button"
              onClick={handleDelete}
              className="btn bg-red-500 hover:bg-red-600"
            >
              <MdDeleteForever /> Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn bg-green-500 hover:bg-green-600"
            >
              <MdCancel /> Cancel
            </button>
          </div>
        </Modal>

        {props.canSelect && data && (
          <td
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            scope="col"
            className={`border-x text-xs text-center px-3 py-3`}
          >
            <input
              onClick={(e) => {
                e.stopPropagation();
              }}
              checked={selectedIds.includes(record.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectRecords(record);
              }}
              type="checkbox"
            />
          </td>
        )}
        {(props.columns ? props.columns : Object.keys(data[0])).map((k, i) => {
          const canTrans = typeof (props.transform ?? {})[k] === "function";
          return (
            <td key={k} className="px-3 text-xs text-center border-0 py-2">
              {canTrans ? (
                <span>{(props.transform as CellTransform<T>)[k](record)}</span>
              ) : typeof record[k] === "boolean" ? (
                <span className={`flex w-full justify-around`}>
                  {record[k] ? (
                    <MdCheckBox className="text-green-500" />
                  ) : (
                    <MdClose className="text-red-500" />
                  )}
                </span>
              ) : (
                <span>
                  {" "}
                  {typeof record[k]?.toDate === "function" ? (
                    record[k].toDate().toISOString().substring(0, 10)
                  ) : columnCollection && columnCollection.column === k ? (
                    <DisplayColumnQuery
                      coll={columnCollection}
                      record={record}
                    />
                  ) : typeof record[k] === "number" && record[k] >= 1000 ? (
                    toRwf(record[k])
                  ) : [null, undefined, ""].includes(record[k]) ? (
                    <>--</>
                  ) : (
                    record[k]?.toString()
                  )}
                </span>
              )}
            </td>
          );
        })}
        {!props.cantAct && (
          <td
            onClick={(e) => e.stopPropagation()}
            className="px-3 text-xl py-2 flex items-center gap-2 justify-center"
          >
            {props.cantView || (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetViewInstance(record);
                }}
                className="icon-button-outline p-[.56rem] bg-blue-700 cursor-pointer text-normal group"
                title="More Info"
              >
                <MdOpenInFull className="text-white  group-hover:[color:white!important]" />
              </button>
            )}
            {(typeof props.cantUpdate === "boolean"
              ? props.cantUpdate
              : (props.cantUpdate as Function)(record)) || (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetUpdateInstance(record);
                }}
                title="Edit"
                className="icon-button-outline p-2   cursor-pointer text-normal group"
              >
                <MdEdit className=" text-blue-500  group-hover:[color:white!important]" />
              </button>
            )}
            {(typeof props.cantDelete === "boolean"
              ? props.cantDelete
              : (props.cantDelete as Function)(record)) || (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                  setDRecord(record);
                }}
                className="icon-button-outline text-normal p-2"
              >
                <MdDeleteForever className="text-red-500" />
              </button>
            )}
          </td>
        )}
      </tr>
    </>
  );
};

export default TableRow;
