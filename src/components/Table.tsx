import { DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { MdAdd, MdSentimentDissatisfied } from "react-icons/md";
import Modal from "./Modal";
import Spinner from "./Spinner";
import TableProvider, {
  TableProps,
  useTableContext,
} from "../context/TableContext";
import TableRow from "./TableRow";
import TableSearch from "./TableSearch";
import TableHeader from "./TableHeader";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import TableRange from "./TableRange";
import TableTotals from "./TableTotals";

const Table = (props: TableProps) => {
  return (
    <TableProvider {...props}>
      <TableContent />
    </TableProvider>
  );
};

const TableContent = () => {
  const {
    defaultSelected,
    defaultView,
    updateInstance,
    viewInstance,
    initialData,
    selectedIds,
    filteredData: data,
    status,
    handleSetUpdateInstance,
    handleSetViewInstance,
    handleSelectRecords,
    maxCreate = Infinity,
    canSelectMultiple = false,
    canRange,
    customHeader,
    getRecords,
    ...props
  } = useTableContext();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    getRecords && getRecords(data);
  }, [data]);

  const singular =
    props.collectionSingular || props.collectionName.slice(0, -1);

  return (
    <div className="p-1 rounded mx-auto w-full">
      {status === "loading" ? <Spinner /> : ""}
      {open && (
        <Modal
          title={`Create ${singular}`}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
        >
          {updateInstance ? (
            props.getUpdateForm && props.getUpdateForm(updateInstance)
          ) : (initialData.length ?? 0) < maxCreate ? (
            props.createForm
          ) : (
            <p className="p-2">
              Can't create more {props.collectionName}. Try updating.
            </p>
          )}
        </Modal>
      )}

      {!!updateInstance && (
        <Modal
          title={`Update ${singular}`}
          open={!!updateInstance}
          onClose={() => {
            handleSetUpdateInstance(null);
          }}
        >
          {updateInstance &&
            props.getUpdateForm &&
            props.getUpdateForm(updateInstance)}
        </Modal>
      )}
      {props.cantView || (
        <Modal
          title={`View ${singular}`}
          open={!!viewInstance}
          onClose={() => {
            handleSetViewInstance(null);
          }}
        >
          {viewInstance && props.onShow && props.onShow(viewInstance)}
        </Modal>
      )}
      <div className="flex border  gap-4 rounded items-center my-1 justify-between">
        {!props.cantSearch && <TableSearch />}
        {canRange ? <TableRange /> : <></>}
        <div className="flex items-center gap-1">
          {customHeader && customHeader}
          {(initialData.length ?? 0) < maxCreate && (
            <button
              onClick={() => {
                setOpen((p) => !p);
              }}
              className="btn justify-self-end"
            >
              <MdAdd /> Add new {singular}
            </button>
          )}
        </div>
      </div>
      {props.hasTotals && <TableTotals />}

      {data && data.length ? (
        <table className="w-full text-sm text-left rounded ">
          <thead className=" text-gray-700 uppercase bg-blue-50 ">
            <TableHeader />
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-gray-200  border-b">
            {data &&
              data.map((record) => (
                <TableRow key={record.id} record={record} />
              ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col gap-2 justify-center items-center p-4 ">
          <p className=" text-center flex flex-col items-center text-base  rounded-lg  p-4 m-2">
            <span className="text-4xl mb-3">
              <MdSentimentDissatisfied />
            </span>
            <span>No {props.collectionName} found.</span>
            {canRange ? (
              <span className="font-bold text-blue-500 block">
                Try another time range.
              </span>
            ) : (
              ""
            )}
          </p>
        </div>
      )}
      {/* <TablePagination /> */}
    </div>
  );
};

export default Table;

export function toNormalCase(str: string) {
  const result = str.replace(/([A-Z]+)/g, " $1");
  const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
  return finalResult;
}

export type TableSearchProps = {
  data: DocumentData[];
  defaultSearchField?: string;
  columns: string[];
};

export function TablePagination() {
  const { hasNext, hasPrev, filteredData, page, nextData, prevData, pageSize } =
    useTableContext();

  return (
    <div className="flex items-center justify-between p-2 bg-blue-100">
      <div className="flex items-center space-x-2">
        <span className="text-blue-700 text-xs font-medium">
          {filteredData.length}
        </span>

        <button
          className={`px-3 py-1 disabled:text-gray-300 rounded-md text-blue-700 ${
            hasPrev ? "hover:bg-blue-200" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => prevData()}
          disabled={!hasPrev}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-blue-700 text-xs font-medium">Page {page}</span>
        <button
          className={`px-3 py-1 disabled:text-gray-300 rounded-md text-blue-700 ${
            hasNext ? "hover:bg-blue-200" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => nextData()}
          disabled={!hasNext}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
