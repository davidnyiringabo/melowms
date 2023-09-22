import { ReactNode, useEffect, useState } from "react";
import { Customer, Fillable, PropsWithInstace } from "../../types";
import { useModalContext } from "../../context/ModalContext";
import Table from "../Table";
import {
  Branches,
  Companies,
  Customers,
  DocNode,
  EmptiesReturns,
  EmptiesStock,
  ItemsTaken,
} from "../../database";
import CustomerReturnsForm from "../forms/sales/CustomerReturnsForm";
import { useCustomAuth } from "../../context/Auth";
import {
  MdDataSaverOn,
  MdOutlineLiquor,
  MdPaid,
  MdRecycling,
} from "react-icons/md";
import { CustomerFinancesComponent } from "./CustomerFinancesComponent";
import Modal from "../Modal";
import { TotalCalc } from "../../context/TableContext";
import UnprocessedForm from "../forms/UnprocessedForm";
import { query, where } from "firebase/firestore";

export type Tab = { name: string; icon: ReactNode };

const Customer = ({
  instance: customer,
}: PropsWithInstace<unknown, Customer>) => {
  const { Branch } = useCustomAuth();
  const { changeSize, changeTitle } = useModalContext();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    changeSize("lg");
    changeTitle(`Customer: ${customer.name}`);
  }, []);

  const allTabs: Tab[] = [
    { name: "Emballage", icon: <MdOutlineLiquor /> },
    { name: "Finances", icon: <MdPaid /> },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2">
        <div className="text-sm mx-auto w-full font-medium text-center text-gray-500 border-b border-gray-200 ">
          <ul className="flex flex-wrap w-full -mb-px">
            <li>
              {allTabs.map((tabs, i) => (
                <button
                  key={tabs.name}
                  onClick={() => setActiveTab(i)}
                  className={`inline-flex items-center gap-2 ${
                    activeTab !== i
                      ? `p-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300`
                      : ` p-4 py-2 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active `
                  }`}
                >
                  {tabs.icon}
                  {tabs.name}
                </button>
              ))}
            </li>
          </ul>
        </div>
        {activeTab === 0 && (
          <CustomerFillables instance={customer as Customer} />
        )}

        {activeTab === 1 && <CustomerFinancesComponent instance={customer} />}
      </div>
    </div>
  );
};

export default Customer;

export function CustomerFillables({
  instance,
}: PropsWithInstace<{}, Customer>) {
  const { branch, Branch } = useCustomAuth();
  const [open2, setOpen2] = useState(false);
  const [open, setOpen] = useState(false);

  const [customer, setCustomer] = useState(instance);

  useEffect(() => {
    setCustomer(instance);
  }, [instance]);

  const totalCalc: TotalCalc<Fillable> = (data) => {
    return [
      {
        totalName: "Total Emballage Remaining",
        value: data.reduce((a: number, b: any) => a + b.returnedQty, 0),
        important: true,
      },
    ];
  };

  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);

  return (
    <div className="flex flex-col gap-2 p-1">
      <Modal
        title="Unprocessed returns"
        open={open2}
        onClose={() => setOpen2(false)}
      >
        <UnprocessedForm instance={customer} />
      </Modal>
      <div className="flex m-0 bg-blue-50 items-center rounded p-1 justify-between w-full">
        {/* <div className="flex gap-1 flex-col">
          <span className="text-sm font-bold text-red-400">Unprocessed</span>
          <span className="text-2xl font-extrabold text-blue-800">
            {customer?.unprocessed ?? 0}
          </span>
        </div> */}
        <button onClick={() => setOpen2(true)} className="btn">
          <MdDataSaverOn /> Add Unprocessed Emballage
        </button>
        <button onClick={() => setOpen(true)} className="btn my-0 w-fit">
          <MdRecycling /> View return history
        </button>
      </div>
      <Modal
        title="Emballage return history"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Table
          createForm={<></>}
          maxCreate={0}
          canRange={true}
          cantAct={true}
          columns={["itemName", "returnedQty", "dateReturned"]}
          collectionName="Emballage Returns"
          query={query(
            emptiesStockQuery.ref,
            where("customer", "==", customer.id)
          )}
        />
      </Modal>

      <Table
        query={query(
          emptiesStockQuery.ref,
          where("customer", "==", customer.id)
        )}
        cantUpdate={true}
        maxCreate={0}
        hasTotals
        totalCalc={totalCalc}
        defaultSearchField="itemName"
        columns={["dateReturned", "remaining"]}
        transform={{
          remaining: (data) => {
            return data.returnedQty;
          },
        }}
        collectionName={"returns"}
        createForm={
          <CustomerReturnsForm isBranch={false} customerOrBranch={customer} />
        }
        // onShow={(instance) => (
        //   <CustomerReturnsForm
        //     isBranch={false}
        //     customerOrBranch={customer}
        //     instance={instance}
        //   />
        // )}
        cantView
        cantAct
      />
    </div>
  );
}
