import Table from "../../components/Table";
import { Invoices } from "../../database";
import { useCustomAuth } from "../../context/Auth";
import withAuthorization from "../../components/hocs/withAuthorization";
import InvoicesForm from "../../components/forms/InvoicesForm";
import { collectionGroup, or, query, where } from "firebase/firestore";
import { useFirestore } from "reactfire";
import Invoice from "../../components/feature/Invoice";
import { ReactNode, useEffect, useState } from "react";
import { MdClose, MdPending, MdVerified } from "react-icons/md";
import { TotalCalc } from "../../context/TableContext";
import { Invoice as InvoiceType } from "../../types";

const InvoicesPage = () => {
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string>();
  const { branch, isSuperAdmin, Branch, isAdmin, tinnumber, isManager } =
    useCustomAuth();
  const firestore = useFirestore();
  const [active, setActive] = useState(0);

  const pendingQuery = query(
    collectionGroup(firestore, Invoices.name),
    where("path.companies", "==", tinnumber),
    where("path.branches", "==", branch),
    where("saved", "==", false)
  );
  const [invoicesQuery, setInvoicesQuery] = useState(pendingQuery);

  useEffect(() => {
    const initialQuery = query(
      collectionGroup(firestore, Invoices.name),
      where("path.companies", "==", tinnumber),
      where("path.branches", "==", branch)
    );

    if (active === 0) {
      setInvoicesQuery(query(initialQuery, where("saved", "==", false)));
    } else if (active === 1) {
      setInvoicesQuery(query(initialQuery, where("confirmed", "==", true)));
    } else if (active === 2) {
      setInvoicesQuery(query(initialQuery, where("canceled", "==", true)));
    }
  }, [active]);

  const totalCalc: TotalCalc<InvoiceType> = (data) => {
    return [
      {
        totalName: "Total VAT",
        value: data.reduce((acc, c) => acc + (c.totalTaxAmount ?? 0), 0),
      },
      {
        totalName: "Total Amount",
        important: true,
        value: data.reduce((acc, c) => acc + (c.totalCost ?? 0), 0),
      },
    ];
  };

  type OrderFilterName = "Pending" | "Confirmed" | "Cancelled";

  type OrderFilterColor = "blue" | "green" | "red";

  type OrderFilter = {
    name: OrderFilterName;
    color: OrderFilterColor;
    icon: ReactNode;
  };

  // The ordering matters
  const filters: OrderFilter[] = [
    { name: "Pending", color: "blue", icon: <MdPending /> },
    { name: "Confirmed", color: "green", icon: <MdVerified /> },
    { name: "Cancelled", color: "red", icon: <MdClose /> },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex p-1 px-2 mt-2 bg-white mx-2 w-fit items-center gap-1 rounded">
        {filters.map((filter, i) => (
          <button
            onClick={() => setActive(i)}
            className={`${
              active === i
                ? ""
                : `bg-white border border-${filter.color}-500 text-${filter.color}-500 hover:bg-${filter.color}-500`
            } btn focus:ring-0  hover:ring-0 p-2 pl-3 bg-${
              filter.color
            }-500 hover:bg-${filter.color}-700 hover:text-white`}
          >
            {filter.icon} {filter.name}
          </button>
        ))}

        <template
          className={`hidden {bg-white border border-green-500 text-green-500 hover:bg-green-500
          btn focus:ring-0  hover:ring-0 p-2 pl-3  bg-green-500 {hover:bg-green-700}  hover:text-white}

          bg-white border border-red-500 text-red-500 hover:bg-red-500
          btn focus:ring-0  hover:ring-0 p-2 pl-3  bg-red-500 hover:bg-red-700  hover:text-white
          bg-white border border-blue-500 text-blue-500 hover:bg-blue-500
          btn focus:ring-0  hover:ring-0 p-2 pl-3  bg-blue-500 hover:bg-blue-700  hover:text-white
          
          `}
        />
      </div>

      <Table
        {...(createdInvoiceId ? { defaultView: createdInvoiceId } : {})}
        collectionName={"orders"}
        defaultSearchField="orderNumber"
        hasTotals={true}
        totalCalc={totalCalc}
        canRange={active !== 0}
        maxCreate={active > 0 ? 0 : Infinity}
        onShow={(instance) => <Invoice invoice={instance} />}
        columns={[
          "orderNumber",
          // 'invoiceNumber',
          "supplier",
          "totalTaxAmount",
          "totalCost",
          "paidAmount",
          "createdTime",
          ...(active > 0 ? (active === 1 ? ["confirmed"] : ["canceled"]) : []),
        ]}
        cantDelete={(record) => record.confirmed || record.canceled}
        columsAs={{
          orderNumber: "Order No",
          invoiceNumber: "invNo",
          totalTaxAmount: "totTax",
          totalCost: "totAmnt",
          createdTime: "Date Created",
        }}
        query={invoicesQuery}
        transform={{
          paidAmount: (r) => r.paidAmount ?? "0",
          orderNumber: (inv) => inv.orderNumber ?? "N/A",
          confirmed: (r) => (
            <span className="flex items-center text-lg justify-center">
              {!!r.confirmed ? (
                <MdVerified className="text-green-600" />
              ) : (
                <MdClose className="text-red-600" />
              )}
            </span>
          ),
          supplier: (r) => {
            return r.supplierName ?? "---";
          },
        }}
        createForm={
          <InvoicesForm onCreated={(id) => setCreatedInvoiceId(id)} />
        }
        getUpdateForm={(instance) => (
          <InvoicesForm
            onCreated={(id) => setCreatedInvoiceId(id)}
            instance={instance}
          />
        )}
      />
    </div>
  );
};

export default withAuthorization({
  requiredClaims: { manager: true, admin: true },
  all: false,
})(InvoicesPage);
