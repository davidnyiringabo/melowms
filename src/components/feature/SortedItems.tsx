import { useEffect, useState } from "react";
import { Tab } from "./Customer";
import { HiCollection } from "react-icons/hi";
import { TbShieldCheckFilled } from "react-icons/tb";
import { MdClose, MdDangerous, MdVerified, MdWarning } from "react-icons/md";
import Tabs from "../Utils/Tabs";
import Table from "../Table";
import {
  CheckedDamagedProducts,
  CheckedEmpties,
  DamagedProducts,
  DocNode,
  EmptiesStock,
  Items,
  SortedCheckedEmpties,
  SortedEmpties,
} from "../../database";
import { useCustomAuth } from "../../context/Auth";
import { Query, getDocs, query, where } from "firebase/firestore";
import { TotalCalc } from "../../context/TableContext";
import NewDamagedItem from "../forms/NewDamagedItem";
import SupplierEmptiesReturnForm from "../forms/sales/EmptiesReturnForm";
import ItemsCreateForm from "../forms/ItemsCreateForm";
import { z } from "zod";
import { toDate } from "./Invoice";
import Modal from "../Modal";
import Spinner from "../Spinner";
import { useModalContext } from "../../context/ModalContext";
import { toast } from "../ToasterContext";

const SortedItems = ({ instance }: { instance: any }) => {
  const sortingTabs: Tab[] = [
    {
      name: "Collected Empties",
      icon: <HiCollection />,
    },
    {
      name: "Checked Empties",
      icon: <TbShieldCheckFilled />,
    },
    {
      name: "Damaged Empties",
      icon: <MdDangerous />,
    },
  ];
  const { handleClose } = useModalContext();
  const totalCollected: TotalCalc<any> = (data) => {
    return [
      {
        totalName: "Total Collected",
        important: true,
        value: data.reduce(
          (curr: number, value: any) => curr + value.returnedQty,
          0
        ),
      },
    ];
  };
  const [total, setTotal] = useState(0);
  const totalChecked: TotalCalc<any> = (data) => {
    let t = data.reduce((curr: number, value: any) => curr + value.quantity, 0);
    setTotal(t);
    return [
      {
        totalName: "Total Checked",
        important: true,
        value: t,
      },
    ];
  };
  const damagedTotal: TotalCalc<any> = (data) => {
    return [
      {
        totalName: "Total Damaged",
        important: true,
        value: data.reduce(
          (curr: number, value: any) => curr + value.quantity,
          0
        ),
      },
    ];
  };
  const { Branch } = useCustomAuth();
  const emptiesStockQuery = (Branch as DocNode).sub(EmptiesStock);
  const [collected, setcollected] = useState<Query>();
  const [checked, setChecked] = useState<Query>();
  const SortedCheckedEmptiesQuery = (Branch as DocNode).sub(
    SortedCheckedEmpties
  );
  const damages = (Branch as DocNode).sub(DamagedProducts);
  const checkedDamagedEmptiesQuery = (Branch as DocNode).sub(
    CheckedDamagedProducts
  );
  const CheckedDmagedEmpties = query(
    checkedDamagedEmptiesQuery.ref,
    where("damageId", "==", instance.id)
  );
  const [change, setChange] = useState(false);
  useEffect(() => {
    if (instance.collectedUnsortedIds.length > 0) {
      const collectedEmpties = query(
        emptiesStockQuery.ref,
        where("sorted", "==", true),
        where("path.empties_stock", "in", instance.collectedUnsortedIds)
      );
      setcollected(collectedEmpties);
    } else {
      const emptycollection = query(
        emptiesStockQuery.ref,
        where("sorted", "==", true),
        where("path.empties_stock", "==", "empty")
      );
      setcollected(emptycollection);
    }
    if (instance.checkedEmptiesIds.length > 0) {
      const sortedCheckedempties = query(
        SortedCheckedEmptiesQuery.ref,
        where("path.sorted_checked_empties", "in", instance.checkedEmptiesIds)
      );
      setChecked(sortedCheckedempties);
    } else {
      const emptycollection = query(
        SortedCheckedEmptiesQuery.ref,
        where("sorted", "==", true),
        where("path.sorted_checked_empties", "==", "empty")
      );
      setChecked(emptycollection);
    }
  }, [instance, change]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [damagedDoc, setDamagedDoc] = useState<any>();
  useEffect(() => {
    const getDamagedDoc = async () => {
      const docSnap = await getDocs(damages.ref);
      const doc = docSnap.docs.find((doc) => doc.id === instance.id);
      setDamagedDoc(doc?.data());
    };
    getDamagedDoc();
  }, []);
  const CheckedEmptiesQuery = (Branch as DocNode).sub(CheckedEmpties);
  const InstanceCheckedEmptiesQuery = query(
    CheckedEmptiesQuery.ref,
    where("sortId", "==", instance.id)
  );
  const sortedEmptiesQuery = (Branch as DocNode).sub(SortedEmpties);
  const handleSaveCheckedEmpties = async (data: any, ins?: any) => {
    if (ins) {
      await sortedEmptiesQuery.doc(instance.id).update({
        totalChecked: instance.totalChecked - ins.quantity + data.quantity,
      });
      await SortedCheckedEmptiesQuery.doc(ins.id).update({
        ...data,
      });
      return;
    }
    const newItem = await SortedCheckedEmptiesQuery.addDoc({
      ...data,
    });
    instance.checkedEmptiesIds.push(newItem.id);
    instance.totalChecked += data.quantity;
    setChange(!change);
    await sortedEmptiesQuery.doc(instance.id).update({
      checkedEmptiesIds: [...instance.checkedEmptiesIds, newItem.id],
      totalChecked: instance.totalChecked + data.quantity,
    });
  };
  const schema = z.object({
    itemName: z.string(),
    item: z.string().min(1).describe("query"),
    quantity: z.number(),
    dateChecked: z.date().default(() => new Date()),
  });
  const [open, setOpen] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [openDamaged, setOpenDamaged] = useState(false);
  const handleSaveSortedEmpties = async (data: any) => {
    return await sortedEmptiesQuery.doc(instance.id).save({
      ...data,
      dateSorted: new Date(),
    });
  };
  const handleSort = async (saveDamages: boolean = true) => {
    try {
      setSorting(true);
      let totalCollectedUnSorted: number = instance.totalCollectedUnSorted,
        totalDamaged: number =
          instance.totalCollectedUnSorted - instance.totalChecked,
        totalChecked: number = total;

      let sorted = await handleSaveSortedEmpties({
        totalCollectedUnSorted,
        totalChecked,
        totalDamaged: saveDamages ? totalDamaged : 0,
        sorted: saveDamages,
      });
      if (
        instance.totalChecked < instance.totalCollectedUnSorted &&
        saveDamages
      ) {
        await damages.doc(sorted.id).save({
          quantity: totalDamaged,
          dateSorted: new Date(),
          approved: false,
        });
      }

      setSorting(false);
      setOpen(false);
      handleClose();
    } catch (error: any) {
      toast.error(error.toString());
    }
  };

  return (
    collected &&
    checked && (
      <div>
        <Modal
          title={"Confirm Sort"}
          open={open}
          onClose={() => {
            setOpen(false);
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
                <span className="font-bold">Total Checked Empties: </span>{" "}
                <span className="font-mono">{instance.totalChecked}</span>
              </p>
              <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                <span className="font-bold">Total Collected Empties: </span>{" "}
                <span className="font-mono">
                  {instance.totalCollectedUnSorted}
                </span>
              </p>
              {instance.totalCollectedUnSorted > instance.totalChecked && (
                <p className="flex border-b  pb-1 items-center font-mono font-bold text-blue-700 mt-5 text-lg gap-3">
                  <span className="font-bold">Total unlocated Empties: </span>{" "}
                  <span className="font-mono">
                    {instance.totalCollectedUnSorted - instance.totalChecked}
                  </span>
                </p>
              )}
              <p className="text-red-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
                <MdWarning />
                After you confirm, you can't edit this sort.
              </p>
              {instance.totalChecked < instance.totalCollectedUnSorted && (
                <p className="text-green-400 pb-1 border-b flex items-center gap-2 my-5 text-sm font-semibold">
                  <MdWarning />
                  There is probably some damages since the unsorted <br />
                  collected empties is greater than total checked empties.
                </p>
              )}
              {instance.totalCollectedUnSorted === 0 &&
                instance.totalChecked === 0 && (
                  <p className="text-red-500 p-2 rounded max-w-xs mx-auto bg-red-200/25  mt-5 text-sm font-bold">
                    You can't sort with no collected items nor total checked
                    empties. All of them are zero.
                  </p>
                )}
              {instance.totalChecked > instance.totalCollectedUnSorted && (
                <p className="text-red-500 flex font-light mb-2 gap-2 p-2 rounded max-w-md mx-auto bg-red-200/25  mt-5 text-sm">
                  <MdDangerous className="text-2xl" />
                  <span>
                    The <span className="font-bold">total empties</span> checked
                    is <span className="font-bold">greater than</span> unsorted
                    collected <span className="font-bold">empties</span>.
                  </span>
                </p>
              )}
              {(instance.totalCollectedUnSorted > 0 ||
                instance.totalChecked > 0) && (
                <button
                  onClick={async () => {
                    if (
                      instance.totalCollectedUnSorted > instance.totalChecked
                    ) {
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
                    <span className="font-bold">Expected to be damaged: </span>{" "}
                    <span className="font-mono">
                      {instance.totalCollectedUnSorted - instance.totalChecked}
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
        <div className="flex w-full justify-between mb-4 gap-2">
          {instance.sorted ? (
            <span className="flex gap-1 items-center text-green-500">
              <MdVerified /> Confirmed
            </span>
          ) : (
            <span className="flex gap-1 text-red-500 items-center">
              <MdClose /> Not yet confirmed
            </span>
          )}
          {!instance.sorted && (
            <div className="flex  gap-1">
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
          )}
        </div>
        <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total Checked Empties </span>
            <span>{instance.totalChecked}</span>
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Sorted At </span>
            <span>{toDate(instance.dateSorted).toLocaleString("en-rw")}</span>
          </div>
        </div>
        <div className="flex bg-gray-100/40 text-xs p-1 shadow-sm rounded border-b flex-wrap md:flex-nowrap items-center">
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total Damaged Empties </span>
            <span>
              {instance.totalCollectedUnSorted - instance.totalChecked > 0
                ? instance.totalCollectedUnSorted - instance.totalChecked
                : 0}
            </span>
          </div>
          <span className="h-[60px] hidden mx-3 mt-1 border-black md:inline-block border-l"></span>
          <div className="grid [&_span:nth-child(even)]:bg-gray-100 [&_span:nth-child(odd)]:uppercase [&_span:nth-child(even)]:text-center  [&_span]:p-2 [&_span]:rounded [&_span:nth-child(even)]:border grid-cols-[auto_240px] gap-2 p-1">
            <span className="mr-2 font-bold">Total colleted Empties </span>
            <span>{instance.totalCollectedUnSorted}</span>
          </div>
        </div>
        <Tabs
          className=" my-1"
          tabs={sortingTabs}
          onTabChange={(_, index) => {
            setActiveIdx(index);
          }}
        />
        {activeIdx === 0 ? (
          <Table
            collectionName="Sorted Collected Empties"
            collectionSingular="Sorted Collected Empties"
            hasTotals
            columns={["customerName", "returnedQty", "dateReturned"]}
            cantView
            cantDelete
            totalCalc={totalCollected}
            cantAct
            cantUpdate
            query={collected}
            createForm={null}
            maxCreate={0}
          />
        ) : activeIdx === 1 ? (
          <Table
            collectionName="Checked Empties"
            collectionSingular="Checked Empties"
            hasTotals
            columns={["itemName", "quantity", "dateChecked"]}
            cantView
            cantDelete={instance.sorted}
            cantAct={instance.sorted}
            totalCalc={totalChecked}
            cantUpdate={instance.sorted}
            query={checked}
            createForm={
              <SupplierEmptiesReturnForm
                schema={schema}
                metadata={{
                  itemName: {
                    hidden: true,
                  },
                  item: {
                    query: Items.ref,
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
            maxCreate={instance.sorted ? 0 : undefined}
            getUpdateForm={(instance: any) => (
              <SupplierEmptiesReturnForm
                schema={schema}
                instance={instance}
                metadata={{
                  itemName: {
                    hidden: true,
                  },
                  item: {
                    query: Items.ref,
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
        ) : (
          <div className="my-3">
            {instance.totalCollectedUnSorted - instance.totalChecked < 0 ? (
              <div className="my-10 text-center">There are no damages</div>
            ) : (
              <>
                {damagedDoc && (
                  <div className="mb-4 flex justify-center mt-5 ml-4">
                    {damagedDoc.approved ? (
                      <span className="flex gap-1 text-green-500 items-center">
                        <MdVerified /> Approved
                      </span>
                    ) : (
                      <span className="flex gap-1 text-red-500 items-center">
                        <MdClose /> Not yet Approved
                      </span>
                    )}
                  </div>
                )}
                <Table
                  columsAs={{
                    action: "Cause of damage",
                  }}
                  totalCalc={damagedTotal}
                  collectionName="Checked Damaged Empties"
                  collectionSingular="Checked Damaged Empties"
                  hasTotals
                  columns={[
                    "itemName",
                    "quantity",
                    "causeOfDamage",
                    "dateChecked",
                  ]}
                  cantView
                  cantDelete={false}
                  query={CheckedDmagedEmpties}
                  maxCreate={0}
                  createForm={<NewDamagedItem damagedId={instance.id} />}
                  getUpdateForm={(instance: any) => {
                    return (
                      <NewDamagedItem
                        instance={instance}
                        damagedId={instance.id}
                      />
                    );
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    )
  );
};

export default SortedItems;
