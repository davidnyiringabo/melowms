import { collectionGroup, query, Query, where } from "firebase/firestore";
import { useFirestore } from "reactfire";
import { useCustomAuth } from "../../context/Auth";
import { CollectionName, Inventory, Sells } from "../../database";
import Table from "../../components/Table";
import ViewInventory from "../../components/feature/ViewInventory";
import { Link } from "react-router-dom";
import InventoryUpdateForm from "../../components/forms/InventoryUpdateForm";
import { Inventory as InvType, InventoryItem } from "../../types";
import toRwf from "../../helpers/toRwf";
import { TotalCalc } from "../../context/TableContext";
import Tabs from "../../components/Utils/Tabs";
import { MdClose, MdPending, MdSell, MdVerified } from "react-icons/md";
import { GiBeerStein, GiWineBottle } from "react-icons/gi";
import { useEffect, useState } from "react";
import { Tab } from "../../components/feature/Customer";
import SellsForm from "../../components/forms/SellsForm";
import SellsShow from "../../components/feature/Sells";

const Stock = () => {
  const { isAdmin, branch, isSuperAdmin, tinnumber, Branch } = useCustomAuth();
  const firestore = useFirestore();
  const inventoryQuery = isSuperAdmin
    ? collectionGroup(firestore, CollectionName.Inventory)
    : isAdmin
    ? query(
        collectionGroup(firestore, CollectionName.Inventory),
        where("path.companies", "==", tinnumber)
      )
    : (Branch?.sub(Inventory).ref as Query);

  const totalCalc: TotalCalc<InvType> = (data) => {
    return [
      {
        totalName: "Total Stock Value",
        important: true,
        value: data.reduce(
          (acc, curr) => acc + curr.unitPrice * curr.quantity,
          0
        ),
      },
    ];
  };
  const tabs: Tab[] = [
    {
      icon: <GiWineBottle />,
      name: "In Stock",
    },
    {
      icon: <MdSell />,
      name: "Sell Point",
    },
    // {
    //   icon: <GiBeerStein />,
    //   name: "Returned from Supplier",
    // },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [createdSellsId, setCreatedSellsId] = useState<string>();
  const handleTabsChange = (tab: Tab, index: number) => {
    setActiveIdx(index);
  };
  const filters = [
    { name: "Pending", color: "blue", icon: <MdPending /> },
    { name: "Confirmed", color: "green", icon: <MdVerified /> },
    { name: "Cancelled", color: "red", icon: <MdClose /> },
  ];
  const [active, setActive] = useState(0);

  const pendingQuery = query(
    collectionGroup(firestore, Sells.name),
    where("path.companies", "==", tinnumber),
    where("path.branches", "==", branch),
    where("saved", "==", false)
  );
  const [sellsQuery, setSellsQuery] = useState(pendingQuery);
  useEffect(() => {
    const initialQuery = query(
      collectionGroup(firestore, Sells.name),
      where("path.companies", "==", tinnumber),
      where("path.branches", "==", branch)
    );

    if (active === 0) {
      setSellsQuery(query(initialQuery, where("saved", "==", false)));
    } else if (active === 1) {
      setSellsQuery(query(initialQuery, where("confirmed", "==", true)));
    } else if (active === 2) {
      setSellsQuery(query(initialQuery, where("canceled", "==", true)));
    }
  }, [active]);
  return (
    <div>
      <Tabs
        className="bg-blue-50 my-1"
        tabs={tabs}
        onTabChange={handleTabsChange}
      />
      <div className="flex gap-1 flex-col">
        {activeIdx === 0 ? (
          <Table
            query={inventoryQuery}
            hasTotals={true}
            totalCalc={totalCalc}
            orderBy={{ direction: "asc", field: "item" }}
            columns={["itemName", "quantity", "unitPrice", "total"]}
            maxCreate={0}
            transform={{ total: (r) => toRwf(r.quantity * r.unitPrice) }}
            cantView={true}
            cantDelete={true}
            createForm={
              <p>
                You need to purchase to add to the stock.{" "}
                <Link className="underline text-blue-500" to="/stock/invoices">
                  Purchase
                </Link>
                .
              </p>
            }
            onShow={(inv) => <ViewInventory inventory={inv} />}
            collectionName={Inventory.name}
            getUpdateForm={(instance) => (
              <InventoryUpdateForm instance={instance as InventoryItem} />
            )}
            collectionSingular={Inventory.name}
          />
        ) : (
          <>
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
              collectionName="Sell Items"
              collectionSingular="Sell Items"
              hasTotals
              cantDelete
              cantUpdate
              onShow={(instance) => <SellsShow sells={instance} />}
              {...(createdSellsId ? { defaultView: createdSellsId } : {})}
              createForm={
                <SellsForm
                  onCreated={(id) => {
                    setCreatedSellsId(id);
                  }}
                />
              }
              getUpdateForm={(instance) => (
                <SellsForm
                  onCreated={(id) => {
                    setCreatedSellsId(id);
                  }}
                  instance={instance}
                />
              )}
              transform={{
                customer: (data) => data.customerName,
              }}
              columns={[
                "customer",
                "totalItems",
                "totalTax",
                "caution",
                "totalPaid",
                "totalCost",
                "dateSold",
                ...(active > 0
                  ? active === 1
                    ? ["confirmed"]
                    : ["canceled"]
                  : []),
              ]}
              canRange={active !== 0}
              maxCreate={active > 0 ? 0 : Infinity}
              query={sellsQuery}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Stock;
