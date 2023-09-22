import { useState } from "react";
import Table from "../../components/Table";
import { useCustomAuth } from "../../context/Auth";
import {
  CheckedEmpties,
  Customers,
  DamagedProducts,
  DocNode,
  EmptiesStock,
  Items,
  SortedCheckedEmpties,
  SortedEmpties,
  SupplierEmptiesReturns,
} from "../../database";
import Tabs from "../../components/Utils/Tabs";
import { Tab } from "../../components/feature/Customer";
import { HiCollection } from "react-icons/hi";
import { FaGetPocket, FaHistory, FaSort } from "react-icons/fa";
import { BsFillSendPlusFill } from "react-icons/bs";
import { DataTransformer, TotalCalc } from "../../context/TableContext";
import { Fillable } from "../../types";
import { groupObjectsAndSum } from "../../helpers/groupsFields";
import SupplierEmptiesReturnForm from "../../components/forms/sales/EmptiesReturnForm";
import { z } from "zod";
import CustomerForm from "../../components/forms/sales/CustomerForm";
import { SubmitHandler } from "react-hook-form";
import ItemsCreateForm from "../../components/forms/ItemsCreateForm";
import Modal from "../../components/Modal";
import {
  MdCheck,
  MdClose,
  MdDangerous,
  MdVerified,
  MdWarning,
} from "react-icons/md";
import Spinner from "../../components/Spinner";
import { toast } from "../../components/ToasterContext";
import SortedItems from "../../components/feature/SortedItems";
import { TbShieldCheckFilled } from "react-icons/tb";
import { query, where } from "firebase/firestore";
import { renderId } from "../../components/feature/DamagedItems";
import { SortedItem } from "../../components/feature/SortedItem";
import { useAuth } from "reactfire";

const EmptiesPage = () => {
  const { Branch, currentUser } = useCustomAuth();
  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);
  const supplierEmptiesQuery = (Branch as DocNode).sub(SupplierEmptiesReturns);

  const [activeIdx, setActiveIdx] = useState(0);

  const handleTabsChange = (tab: Tab, index: number) => {
    setActiveIdx(index);
  };

  const itemsTakenTransform: DataTransformer<Fillable> = (data) => {
    const result = groupObjectsAndSum(data, "item", ["remaining"])
      .groupedArray as Fillable[];

    return result;
  };

  const tabs: Tab[] = [
    {
      icon: <HiCollection />,
      name: "Collected Empties",
    },
    {
      icon: <TbShieldCheckFilled />,
      name: "Sorted Empties",
    },

    {
      icon: <FaGetPocket />,
      name: "Returned to supplier",
    },
  ];
  const sortTabs: Tab[] = [
    {
      icon: <MdCheck />,
      name: "Sorted Items",
    },
    {
      icon: <FaHistory />,
      name: "Sort History",
    },
  ];
  const [sortTabIndex, setSortTabIndex] = useState(0);
  const schemas = [
    z.object({
      customerName: z.string().min(1),
      customer: z.string().min(1).describe("query"),
      returnedQty: z.number(),
      dateReturned: z.date().default(() => new Date()),
    }),
    z.object({
      itemName: z.string(),
      item: z.string().min(1).describe("query"),
      quantity: z.number(),
      dateChecked: z.date().default(() => new Date()),
    }),
    z.object({
      itemName: z.string(),
      item: z.string().min(1).describe("query"),
      quantity: z.number(),
      dateSubmitted: z.date().default(() => new Date()),
    }),
  ];

  const customersQuery = Branch?.sub(Customers).ref;
  const itemsQuery = Items.ref;

  const handleSaveSupplierReturns: SubmitHandler<any> = async (
    data,
    instance?: any
  ) => {
    const returns = (Branch as DocNode).sub(SupplierEmptiesReturns);
    if (instance) {
      return await returns.doc(instance.id).save(data);
    }
    data.sent = false;
    return await returns.addDoc(data);
  };

  const handleSaveCollectionEmpties = async (data: any, instance?: any) => {
    if (instance) {
      return await emptiesStockQuery.doc(instance.id).save(data);
    }
    data.sorted = false;
    return await emptiesStockQuery.addDoc(data);
  };

  const [unsorted, setUnsorted] = useState(0);

  const unsortedCollectionTotalCalc: TotalCalc<any> = (data: any[]) => {
    return [
      {
        totalName: "Total Unsorted Empties",
        important: true,
        value: data.reduce(
          (acc: number, curr: any) => acc + curr.returnedQty,
          0
        ),
      },
    ];
  };

  const collectionTotalCalc: TotalCalc<any> = (data: any[]) => {
    const totalSortedEmpties = data.reduce(
      (acc: number, curr: any) => acc + (curr.sorted ? curr.returnedQty : 0),
      0
    );

    const totalEmpties = data.reduce(
      (acc: number, curr: any) => acc + curr.returnedQty,
      0
    );

    setUnsorted(totalEmpties - totalSortedEmpties);

    return [
      {
        totalName: "Total Empties",
        important: true,
        value: totalEmpties,
      },
    ];
  };

  const checkedTotalCalc: TotalCalc<any> = (data: any[]) => {
    const totalChecked = data.reduce(
      (acc: number, curr: any) => acc + curr.quantity,
      0
    );

    return [
      {
        totalName: "Total Checked",
        important: true,
        value: totalChecked,
      },
    ];
  };

  const SortedEmptiesTotalCalc: TotalCalc<any> = (data: any[]) => {
    const totalChecked = data.reduce(
      (acc: number, curr: any) => acc + curr.totalChecked,
      0
    );

    const totalCollected = data.reduce(
      (acc: number, curr: any) => acc + curr.totalCollectedUnSorted,
      0
    );

    const totalDamaged = data.reduce(
      (acc: number, curr: any) => acc + curr.totalDamaged,
      0
    );

    return [
      {
        totalName: "Available",
        important: true,
        value: totalChecked,
      },
      {
        totalName: "Total Collected",
        important: true,
        value: totalCollected,
      },
      {
        totalName: "Total Damaged",
        important: true,
        value: totalDamaged,
      },
    ];
  };

  const damages = (Branch as DocNode).sub(DamagedProducts);
  const [open, setOpen] = useState(false);
  const CheckedEmptiesQuery = (Branch as DocNode).sub(CheckedEmpties);
  const SortedCheckedEmptiesQuery = (Branch as DocNode).sub(
    SortedCheckedEmpties
  );
  const [totalCheckedEmpties, setTotalCheckedEmpties] = useState(0);
  const handleSaveCheckedEmpties = async (data: any, instance?: any) => {
    if (instance) {
      return await CheckedEmptiesQuery.doc(instance.id).save(data);
    }
    return await CheckedEmptiesQuery.addDoc(data);
  };
  const [newOpener, setNewOpener] = useState(false);
  const [collectedUnsorted, setCollectedUnsorted] = useState<any[]>();
  const sortedEmptiesQuery = (Branch as DocNode).sub(SortedEmpties);
  const [checkedEmpties, setCheckedEmpties] = useState<any[]>([]);
  const [sorting, setSorting] = useState(false);
  const handleSaveSortedEmpties = async (data: any) => {
    return await sortedEmptiesQuery.addDoc({
      ...data,
      dateSorted: new Date(),
    });
  };
  const aboutToSortTabs: Tab[] = [
    {
      name: "Total Emballage",
      icon: <HiCollection />,
    },
    {
      name: "Checked",
      icon: <MdCheck />,
    },
  ];

  const unsortedCollectedQuery = query(
    emptiesStockQuery.ref,
    where("sorted", "==", false)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openDamaged, setOpenDamaged] = useState(false);
  const handleSort = async (saveDamages: boolean = true) => {
    try {
      setSorting(true);
      let collectedUnsortedIds: string[] = [],
        checkedEmptiesIds: string[] = [],
        totalCollectedUnSorted: number = 0,
        totalDamaged: number = unsorted - totalCheckedEmpties,
        totalChecked: number = 0;
      collectedUnsorted?.map(async (item) => {
        collectedUnsortedIds.push(item.id);
        totalCollectedUnSorted += item.returnedQty;
        await emptiesStockQuery.doc(item.id).save({
          sorted: true,
        });
      });

      for (let i = 0; i < checkedEmpties?.length; i++) {
        totalChecked += checkedEmpties[i].quantity;
        await CheckedEmptiesQuery.doc(checkedEmpties[i].id).deleteForever();
        let newItem = await SortedCheckedEmptiesQuery.addDoc({
          ...checkedEmpties[i],
          doneBy: currentUser?.displayName
        });

        checkedEmptiesIds.push(newItem.id);
      }
      let sorted = await handleSaveSortedEmpties({
        collectedUnsortedIds,
        checkedEmptiesIds,
        totalDamaged: saveDamages ? (totalDamaged < 0 ? 0 : totalDamaged) : 0,
        totalCollectedUnSorted,
        totalChecked,
        sorted: saveDamages,
      });
      if (totalCheckedEmpties < unsorted && saveDamages) {
        await damages.doc(sorted.id).save({
          quantity: totalDamaged,
          dateSorted: new Date(),
          approved: false,
        });

        setOpenDamaged(false);
      }

      setSorting(false);
      setNewOpener(false);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.toString());
    }
  };

  return (
    <div>
      <Tabs
        className="bg-blue-50 my-1"
        tabs={tabs}
        onTabChange={handleTabsChange}
      />
      <Modal
        open={open}
        title="Sort Items"
        onClose={() => {
          setOpen(false);
        }}
        size="lg"
      >
        <Modal
          title={"Confirm Sort"}
          open={newOpener}
          onClose={() => {
            setNewOpener(false);
          }}
        >
          {sorting ? (
            <div className="my-3 flex flex-col gap-3 items-center">
              <div>We are sorting items you selected.</div>
              <Spinner />
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold">
                Are you ready to confirm this sort?
              </p>

              <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                <span className="font-bold">Checked: </span>{" "}
                <span className="font-mono">{totalCheckedEmpties}</span>
              </p>
              <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                <span className="font-bold">Total Emballage: </span>{" "}
                <span className="font-mono">{unsorted}</span>
              </p>

              {unsorted - totalCheckedEmpties > 0 && (
                <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                  <span className="font-bold">Remaining: </span>{" "}
                  <span className="font-mono">
                    {unsorted - totalCheckedEmpties}
                  </span>
                </p>
              )}

              {totalCheckedEmpties < unsorted && (
                <p className="text-green-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
                  <MdWarning />
                  There is probably some damages since the unsorted <br />
                  collected empties is greater than total checked empties.
                </p>
              )}
              {unsorted === 0 && totalCheckedEmpties === 0 && (
                <p className="text-red-500 p-2 rounded max-w-xs mx-auto bg-red-200/25  mt-5 text-sm font-bold">
                  You can't sort with no collected items nor total checked
                  empties. All of them are zero.
                </p>
              )}
              {totalCheckedEmpties > unsorted && (
                <p className="text-red-500 flex font-light mb-2 gap-2 p-2 rounded max-w-md mx-auto bg-red-200/25  mt-5 text-sm">
                  <MdDangerous className="text-2xl" />
                  <span>
                    The <span className="font-bold">total empties</span> checked
                    is <span className="font-bold">greater than</span> unsorted
                    collected <span className="font-bold">empties</span>.
                  </span>
                </p>
              )}
              {(unsorted > 0 || totalCheckedEmpties > 0) && (
                <button
                  onClick={async () => {
                    if (unsorted > totalCheckedEmpties) {
                      setOpenDamaged(true);
                      return;
                    }
                    await handleSort();
                  }}
                  className="btn self-end mt-3  bg-green-400 hover:bg-green-600"
                >
                  <MdVerified />
                  Confirm
                </button>
              )}
              <Modal
                open={openDamaged}
                onClose={() => {
                  setOpenDamaged(false);
                }}
                title="Confirm Existence of Damages"
              >
                <div className="my-3">
                  <p className="text-lg font-semibold">
                    Are you sure there are damages?
                  </p>
                  <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                    <span className="font-bold">Remaining: </span>{" "}
                    <span className="font-mono">
                      {unsorted - totalCheckedEmpties}
                    </span>
                  </p>
                  <div className="flex justify-end mt-4">
                    <button
                      className="btn self-end bg-red-500 hover:bg-red-600"
                      onClick={async () => {
                        await handleSort(false);
                      }}
                    >
                      <MdDangerous />
                      Deny
                    </button>
                    <button
                      onClick={async () => {
                        await handleSort();
                      }}
                      className="btn self-end  bg-green-400 hover:bg-green-600"
                    >
                      <MdVerified />
                      Confirm
                    </button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </Modal>
        <div className="flex w-full justify-end mb-4 gap-2">
          <div className="flex  gap-1">
            <button
              onClick={() => {
                setNewOpener(true);
              }}
              className="btn self-end "
            >
              <MdVerified />
              Confirm
            </button>
          </div>
        </div>
        <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Checked </span>
            <span>{totalCheckedEmpties}</span>
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Sorted At </span>
            <span>{new Date().toLocaleString("en-rw")}</span>
          </div>
        </div>
        <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Remaining </span>
            <span>
              {unsorted - totalCheckedEmpties > 0
                ? unsorted - totalCheckedEmpties
                : 0}
            </span>
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total Emballage </span>
            <span>{unsorted}</span>
          </div>
        </div>
        <Tabs
          tabs={aboutToSortTabs}
          onTabChange={(_, index) => {
            setCurrentIndex(index);
          }}
          className="mt-5 mb-3"
        />
        {currentIndex === 0 ? (
          <Table
            query={unsortedCollectedQuery}
            collectionName="Unsorted Collected Empties"
            totalCalc={unsortedCollectionTotalCalc}
            hasTotals
            cantView
            cantUpdate={(record) => {
              return record.sorted;
            }}
            cantDelete={(record) => {
              return record.sorted;
            }}
            cantAct={collectedUnsorted?.length === 0}
            getUpdateForm={(instance: any) => (
              <SupplierEmptiesReturnForm
                schema={schemas[activeIdx]}
                instance={instance}
                metadata={{
                  customerName: {
                    hidden: true,
                  },
                  customer: {
                    query: customersQuery,
                    label: "",
                    canSearchQuery: true,
                    display: "name",
                    value: "id",
                    addForm: <CustomerForm />,
                    getUpdateForm(instance: any) {
                      return <CustomerForm instance={instance} />;
                    },
                    onSelect(record: any, setValue: Function) {
                      setValue("customerName", record.name);
                    },
                  },
                }}
                handleSave={(data: any) =>
                  handleSaveCollectionEmpties(data, instance)
                }
              />
            )}
            columns={["customerName", "returnedQty", "dateReturned"]}
            // transform={{
            //   returnedQty: (data) => {
            //     return <span className={`${data.sorted && "line-through"}`}>{data.returnedQty}</span>;
            //   },
            // }}
            createForm={
              <SupplierEmptiesReturnForm
                schema={schemas[activeIdx]}
                metadata={{
                  customerName: {
                    hidden: true,
                  },
                  customer: {
                    query: customersQuery,
                    label: "",
                    canSearchQuery: true,
                    display: "name",
                    value: "id",
                    addForm: <CustomerForm />,
                    getUpdateForm(instance: any) {
                      return <CustomerForm instance={instance} />;
                    },
                    onSelect(record: any, setValue: Function) {
                      setValue("customerName", record.name);
                    },
                  },
                }}
                handleSave={(data: any) => handleSaveCollectionEmpties(data)}
              />
            }
          />
        ) : (
          <Table
            query={CheckedEmptiesQuery.ref}
            columns={["itemName", "quantity", "dateChecked"]}
            transformData={(data) => {
              setTotalCheckedEmpties(data.reduce((a, c) => a + c.quantity, 0));
              return data;
            }}
            cantView
            getRecords={(records) => {
              setCheckedEmpties(records);
            }}
            collectionName="Checked Empties"
            collectionSingular="Checked Empties"
            cantDelete={false}
            hasTotals
            totalCalc={checkedTotalCalc}
            createForm={
              <SupplierEmptiesReturnForm
                schema={schemas[1]}
                metadata={{
                  itemName: {
                    hidden: true,
                  },
                  item: {
                    query: itemsQuery,
                    label: "",
                    canSearchQuery: true,
                    display: "name",
                    value: "id",
                    addForm: <ItemsCreateForm />,
                    getUpdateForm(instance: any) {
                      return <ItemsCreateForm instance={instance} />;
                    },
                    onSelect(record: any, setValue: Function) {
                      setValue("itemName", record.name);
                    },
                  },
                }}
                handleSave={(data: any) => {
                  handleSaveCheckedEmpties(data);
                }}
              />
            }
            getUpdateForm={(instance: any) => (
              <SupplierEmptiesReturnForm
                schema={schemas[1]}
                instance={instance}
                metadata={{
                  itemName: {
                    hidden: true,
                  },
                  item: {
                    query: itemsQuery,
                    label: "",
                    canSearchQuery: true,
                    display: "name",
                    value: "id",
                    addForm: <ItemsCreateForm />,
                    getUpdateForm(instance: any) {
                      return <ItemsCreateForm instance={instance} />;
                    },
                    onSelect(record: any, setValue: Function) {
                      setValue("itemName", record.name);
                    },
                  },
                }}
                handleSave={(data: any) => {
                  handleSaveCheckedEmpties(data, instance);
                }}
              />
            )}
          />
        )}
      </Modal>
      {activeIdx === 0 ? (
        <Table
          collectionName="Empties"
          collectionSingular="Empties collection"
          totalCalc={collectionTotalCalc}
          hasTotals
          cantView
          cantUpdate={(record) => {
            return record.sorted;
          }}
          cantDelete={(record) => {
            return record.sorted;
          }}
          cantAct={collectedUnsorted?.length === 0}
          customHeader={
            <button
              onClick={() => {
                setOpen(true);
              }}
              className="btn"
            >
              <FaSort />
              <span>Sort</span>
            </button>
          }
          getUpdateForm={(instance: any) => (
            <SupplierEmptiesReturnForm
              schema={schemas[activeIdx]}
              instance={instance}
              metadata={{
                customerName: {
                  hidden: true,
                },
                customer: {
                  query: customersQuery,
                  label: "",
                  canSearchQuery: true,
                  display: "name",
                  value: "id",
                  addForm: <CustomerForm />,
                  getUpdateForm(instance: any) {
                    return <CustomerForm instance={instance} />;
                  },
                  onSelect(record: any, setValue: Function) {
                    setValue("customerName", record.name);
                  },
                },
              }}
              handleSave={(data: any) =>
                handleSaveCollectionEmpties(data, instance)
              }
            />
          )}
          columns={["customerName", "returnedQty", "dateReturned"]}
          // transform={{
          //   returnedQty: (data) => {
          //     return <span className={`${data.sorted && "line-through"}`}>{data.returnedQty}</span>;
          //   },
          // }}
          createForm={
            <SupplierEmptiesReturnForm
              schema={schemas[activeIdx]}
              metadata={{
                customerName: {
                  hidden: true,
                },
                customer: {
                  query: customersQuery,
                  label: "",
                  canSearchQuery: true,
                  display: "name",
                  value: "id",
                  addForm: <CustomerForm />,
                  getUpdateForm(instance: any) {
                    return <CustomerForm instance={instance} />;
                  },
                  onSelect(record: any, setValue: Function) {
                    setValue("customerName", record.name);
                  },
                },
              }}
              handleSave={(data: any) => handleSaveCollectionEmpties(data)}
            />
          }
          //   maxCreate={0}
          getRecords={(records) => {
            setCollectedUnsorted(records.filter((record) => !record.sorted));
          }}
          query={emptiesStockQuery.ref}
        />
      ) : activeIdx === 1 ? (
        <>
          <Tabs
            tabs={sortTabs}
            onTabChange={(_, index) => {
              setSortTabIndex(index);
            }}
          />
          {sortTabIndex === 1 ? (
            <Table
              collectionName="Sorted Empties"
              collectionSingular="Sorted Empties"
              columns={[
                "id",
                "Total Collected",
                "Total Checked",
                "Total damaged",
                "dateSorted",
              ]}
              defaultSearchField="id"
              searchField="id"
              cantSearch={false}
              hasTotals
              createForm={null}
              maxCreate={0}
              onShow={(instance) => <SortedItems instance={instance} />}
              cantUpdate
              totalCalc={SortedEmptiesTotalCalc}
              transform={{
                id: (data) => {
                  return renderId(data.id);
                },
                "Total Collected": (data) => {
                  return data.totalCollectedUnSorted;
                },
                "Total Checked": (data) => {
                  return data.totalChecked;
                },
                "Total damaged": (data) => {
                  return data.totalDamaged;
                },
              }}
              query={sortedEmptiesQuery.ref}
            />
          ) : (
            <Table
              collectionName="Sorted Items"
              collectionSingular="Sorted Items"
              columns={["itemName", "quantity", "dateChecked"]}
              defaultSearchField="itemName"
              searchField="itemName"
              cantUpdate
              cantDelete
              onShow={(instance) => <SortedItem instance={instance} />}
              query={SortedCheckedEmptiesQuery.ref}
              transformData={(data) => {
                // return array of data but first check the item are equal then unite the quantity
                const result = groupObjectsAndSum(data, "item", ["quantity"]);
                return result.groupedArray;
              }}
              createForm={null}
              maxCreate={0}
              hasTotals
            />
          )}
        </>
      ) : (
        <Table
          collectionName="Return to supplier"
          collectionSingular="Return to supplier"
          cantView
          cantDelete={false}
          // canRange
          customHeader={
            <button title="Send" className="btn" onClick={() => {}}>
              <BsFillSendPlusFill />
              <span>Send to supplier</span>
            </button>
          }
          columns={[
            "itemName",
            "quantity",
            "dateSubmitted",
            "sent",
            "dateReturned",
          ]}
          columsAs={{ returnedQty: "returned quantity" }}
          transformData={itemsTakenTransform}
          getUpdateForm={(instance: any) => (
            <SupplierEmptiesReturnForm
              instance={instance}
              schema={schemas[activeIdx]}
              handleSave={(data: any) =>
                handleSaveSupplierReturns(data, instance)
              }
            />
          )}
          query={supplierEmptiesQuery.ref}
          createForm={
            <SupplierEmptiesReturnForm
              schema={schemas[activeIdx]}
              handleSave={handleSaveSupplierReturns}
              metadata={{
                itemName: {
                  hidden: true,
                },
                item: {
                  query: Items.ref,
                  label: "",
                  canSearchQuery: true,
                  // add condition to check if checked

                  display: "itemName",
                  value: "id",
                  columns: ["itemName", "quantity", "sorted"],
                  // // addForm: <SupplierEmptiesReturnForm  />,
                  onSelect(record: any, setValue: Function) {
                    setValue("itemName", record.name);
                  },
                },
              }}
            />
          }
        />
      )}
    </div>
  );
};

export default EmptiesPage;
