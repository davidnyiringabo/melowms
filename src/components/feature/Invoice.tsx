import { useEffect, useState } from "react";
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import Table from "../Table";
import { useCustomAuth } from "../../context/Auth";
import {
  Branches,
  Companies,
  DocNode,
  Grants,
  Invoices,
  Purchases,
  SortedCheckedEmpties,
  Suppliers,
} from "../../database";
import PurchaseForm from "../forms/PurchaseForm";
import { Grant, Invoice, Purchase } from "../../types";
import {
  MdAdd,
  MdAlarm,
  MdCheckCircle,
  MdClose,
  MdDangerous,
  MdVerified,
  MdWarning,
} from "react-icons/md";
import { useModalContext } from "../../context/ModalContext";
import Modal from "../Modal";
import toRwf from "../../helpers/toRwf";
import {
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from "reactfire";
import Spinner from "../Spinner";
import AddInvoiceNumberForm from "../forms/AddInvoiceNumberForm";
import InvoiceActions from "./InvoiceActions";

const Invoice = ({ invoice: initialInvoice }: { invoice: Invoice }) => {
  const { tinnumber, company, Branch } = useCustomAuth();
  const { changeSize, handleClose } = useModalContext();
  const [open, setOpen] = useState(false);
  const [grant, setGrant] = useState<Grant>();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isSameSupplier, setIsSameSupplier] = useState(false);
  const [canAddIN, setCanAddIN] = useState(false);

  const grants = Companies.doc(tinnumber as string).sub(Grants);
  const invoiceDoc = (Branch as DocNode)
    .sub(Suppliers)
    .doc(invoice.supplier)
    .sub(Invoices)
    .doc(invoice.id);

  const { data, status } = useFirestoreCollectionData(
    grants.ref as CollectionReference<Grant>,
    { idField: "id" }
  );
  const { data: invoiceData, status: inStatus } = useFirestoreDocData(
    invoiceDoc.ref as DocumentReference<Invoice>,
    {
      idField: "id",
    }
  );

  useEffect(() => {
    changeSize && changeSize("lg");
  }, []);

  useEffect(() => {
    if (invoiceData) setInvoice(invoiceData);
  }, [invoiceData]);

  useEffect(() => {
    if (data) setGrant(data[0]);
  }, [data]);

  useEffect(() => {
    setIsSameSupplier(invoice.supplier === grant?.supplier);
  }, [grant, invoice]);

  const confirmInvoice = () => {
    Companies.doc(tinnumber as string)
      .sub(Branches)
      .doc(invoice.path.branches)
      .sub(Suppliers)
      .doc(invoice.path.suppliers)
      .sub(Invoices)
      .doc(invoice.id)
      .save({ confirmed: true });
  };

  const shipmentCost =
    ((invoice as any).shipmentCost as number | undefined) ??
    (invoice.totalQuantity ?? 0) * 300;
  // const exciseDuties =
  //   ((invoice as any).exciseDuties as number | undefined) ??
  //   ((invoice.totalCost ?? 0) * 60) / 100;
  const amountToBePaid = invoice.totalCost ?? 0;
  const firestore = useFirestore();

  return (
    <div>
      {invoice && open && (
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
            <span className="font-bold">Total Amount: </span>{" "}
            <span className="font-mono">{toRwf(invoice.totalCost ?? 0)}</span>
          </p>
          <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
            <span className="font-bold">Total Items: </span>{" "}
            <span className="font-mono">{invoice.totalItemCount ?? 0}</span>
          </p>

          <p className="text-red-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
            <MdWarning />
            After you confirm, you can't edit this purchase.
          </p>
          {(invoice.totalCost ?? 0) <= 0 && (
            <p className="text-red-500 p-2 rounded max-w-xs mx-auto bg-red-200/25  mt-5 text-sm font-bold">
              {" "}
              You can't save a purchase with no selected items. The total is
              zero.
            </p>
          )}
          {/* <div className="border-y my-1" /> */}
          {(grant?.balance ?? 0) < amountToBePaid && (
            <p className="text-red-500 flex font-light mb-2 gap-2 p-2 rounded max-w-md mx-auto bg-red-200/25  mt-5 text-sm">
              <MdDangerous className="text-2xl" />
              <span>
                The <span className="font-bold">total amount</span> of purchase
                is <span className="font-bold">greater than</span> available{" "}
                <span className="font-bold">grant balance</span>.
              </span>
            </p>
          )}
          {!isSameSupplier && (
            <p className="text-red-500 flex font-light mb-2 gap-2 p-2 rounded max-w-md mx-auto bg-red-200/25  mt-5 text-sm">
              <MdDangerous className="text-2xl" />
              <span>
                The <span className="font-bold">supplier</span> for this order
                doesn't have any <span className="font-bold">grants</span> in
                company "{company?.name}".
              </span>
            </p>
          )}
          {(status === "loading" || inStatus === "loading") && (
            <div className="flex justify-center p-2 items-center">
              <Spinner />
            </div>
          )}
          {!invoice.invoiceNumber && (
            <>
              <Modal
                title="Add Invoice Number"
                onClose={() => setCanAddIN(false)}
                open={canAddIN}
              >
                <AddInvoiceNumberForm
                  invoiceRef={doc(firestore, (invoice as any)._cref as string)}
                />
              </Modal>
              <div className="my-2 mt-5">
                <button onClick={() => setCanAddIN(true)} className="btn">
                  <MdAdd /> Add Invoice Number
                </button>
              </div>
            </>
          )}
          <div className="flex items-center">
            {inStatus !== "loading" &&
              isSameSupplier &&
              status !== "loading" &&
              invoice.totalItemCount &&
              invoice.invoiceNumber &&
              amountToBePaid &&
              !((grant?.balance ?? 0) < amountToBePaid) && (
                <>
                  <button
                    onClick={() => {
                      confirmInvoice();
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
              invoice.confirmed ? "text-green-500" : "text-red-400"
            } flex items-center gap-2`}
          >
            {invoice.confirmed || invoice.canceled ? (
              invoice.canceled ? (
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
                  <InvoiceActions invoiceDoc={invoiceDoc} invoice={invoice} />
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
            <span className="mr-2 font-bold">Created At </span>
            <span>{toDate(invoice.createdTime).toLocaleString("en-rw")}</span>
            <span className="mr-2 font-bold">VAT </span>
            <span>{toRwf(invoice.totalTaxAmount ?? 0)}</span>
            {/* <span className="mr-2 font-bold">Excise Duties </span>
            <span>{toRwf(exciseDuties)}</span> */}
            <span className="mr-2 font-bold">Shipment Cost </span>
            <span>{toRwf(shipmentCost)}</span>
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total Quantity </span>
            <span>{invoice.totalQuantity ?? "Unknown"}</span>
            <span className="mr-2 font-bold">Total Cost (No VAT) </span>
            <span>
              {toRwf((invoice.totalCost ?? 0) - (invoice.totalTaxAmount ?? 0))}
            </span>
            {/* <span className="mr-2 font-bold">Total Cost (With VAT) </span>
            <span>{toRwf(invoice.totalCost ?? 0)}</span> */}
            <span className="mr-2 font-bold text-blue-500">
              Amount to be Paid{" "}
            </span>
            <span className="[background-color:rgb(59_130_246_/_var(--tw-bg-opacity))_!important] text-white">
              {toRwf(amountToBePaid)}
            </span>
          </div>
        </div>
      ) : (
        <Spinner />
      )}
      <InvoicePurchases invoice={invoice} />
    </div>
  );
};

export default Invoice;

export function toDate(firebaseTimeStamp: Timestamp) {
  return new Timestamp(
    firebaseTimeStamp.seconds,
    firebaseTimeStamp.nanoseconds
  ).toDate();
}

export function InvoicePurchases({
  invoice,
}: {
  invoice: { [k: string]: any };
}) {
  const { tinnumber, Branch } = useCustomAuth();

  const purchaseQuery = Companies.doc(tinnumber as string)
    .sub(Branches)
    .doc(invoice.path.branches)
    .sub(Suppliers)
    .doc(invoice.path.suppliers)
    .sub(Invoices)
    .doc(invoice.id)
    .sub(Purchases).ref;
  const SortedCheckedEmptiesQuery = (Branch as DocNode).sub(
    SortedCheckedEmpties
  );
  return (
    <Table
      query={purchaseQuery}
      cantView={true}
      defaultSearchField="itemName"
      columns={["itemName", "quantity", "unitPrice", "total", "sellingPrice"]}
      transform={{ total: (r) => toRwf(r.total) }}
      collectionName={"items"}
      cantDelete={(record) =>
        record.confirmed || invoice.confirmed || invoice.canceled
      }
      // onDelete={}
      deletedRecord={async (record) => {
        const newQuery = query(
          SortedCheckedEmptiesQuery.ref,
          where("item", "==", record.item)
        );
        const docs = await getDocs(newQuery);
        if (docs.empty) {
          await SortedCheckedEmptiesQuery.addDoc({
            item: record.item,
            quantity: record.quantity,
            dateChecked: new Date(),
            doneBy: record.doneBy,
          });
        }
        let doc = docs.docs[0];
        return updateDoc(doc.ref, {
          quantity: doc.data().quantity + record.quantity,
        });
      }}
      createForm={
        invoice?.confirmed || invoice?.canceled ? (
          <p>
            Order was {invoice.confirmed ? "confirmed" : "cancelled"}, it can't
            be updated.
          </p>
        ) : (
          <PurchaseForm invoice={invoice} />
        )
      }
      getUpdateForm={(instance) => (
        <PurchaseForm invoice={invoice} instance={instance as Purchase} />
      )}
    />
  );
}
