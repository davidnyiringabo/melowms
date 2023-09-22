import { useCustomAuth } from "../../context/Auth";
import {
  Branches,
  Companies,
  DocNode,
  Invoices,
  Items,
  Purchases,
  SortedCheckedEmpties,
  Suppliers,
} from "../../database";
import { Item } from "../../types";
import {
  CollectionReference,
  deleteDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import withAuthorization from "../hocs/withAuthorization";
import { toast } from "../ToasterContext";
import { Purchase } from "../../types";
import DynamicForm from "./Form";
import ItemsCreateForm from "./ItemsCreateForm";
import { useModalContext } from "../../context/ModalContext";
import { useEffect } from "react";

const OtherPurchaseFieldsSchema = z.object({
  purchaseUnitPrice: z.number().step(0.01),
});

const purchaseSchema = z.object({
  item: z.string().trim().min(1).describe("query"),
  itemName: z.string().min(1).describe("hidden"),
  quantity: z.number().min(1).default(0),
  unitPrice: z.number().step(0.01).min(0.01).multipleOf(0.01).default(0),
  sellingPrice: z.number().step(0.01).min(0).default(0),
  taxCode: z
    .string()
    .min(1, { message: "Invalid tax type, choose a valid item" })
    .describe("hidden"),
  taxAmount: z.number().min(0).describe("hidden").default(0),
  total: z.number().describe("hidden").min(0).default(0),
  nonTaxableAmount: z.number().min(0).default(0),
});

const PurchaseForm = ({
  invoice,
  instance,
}: {
  invoice: { [k: string]: any };
  instance?: Purchase;
}) => {
  const { tinnumber, branch, Branch, currentUser } = useCustomAuth();
  const { changeTitle } = useModalContext();
  const SortedCheckedEmptiesQuery = (Branch as DocNode).sub(
    SortedCheckedEmpties
  );
  useEffect(() => changeTitle("Add purchase item"), []);

  const itemsQuery = Items.ref as CollectionReference<Item>;

  const removeItemFromSortedChecked = async (
    item: string,
    quantity: number
  ) => {
    const newQuery = query(
      SortedCheckedEmptiesQuery.ref,
      where("item", "==", item)
    );
    const docs = await getDocs(newQuery);
    if (docs.empty) {
      await SortedCheckedEmptiesQuery.addDoc({
        item,
        quantity: -quantity,
        dateChecked: new Date(),
        doneBy: currentUser?.displayName,
      });
    }
    let doc = docs.docs[0];
    if (instance) {
      return updateDoc(doc.ref, {
        quantity: doc.data().quantity - quantity + instance.quantity,
      });
    }
    return updateDoc(doc.ref, {
      quantity: doc.data().quantity - quantity,
    });
  };

  const handleCreatePurchase: SubmitHandler<
    z.infer<typeof purchaseSchema>
  > = async (_data) => {
    const newPurchases = Companies.doc(tinnumber as string)
      .sub(Branches)
      .doc(branch as string)
      .sub(Suppliers)
      .doc(invoice.path.suppliers)
      .sub(Invoices)
      .doc(invoice.id)
      .sub(Purchases);
    const doc = newPurchases.doc(_data.item);
    if (!instance && (await doc.exists())) {
      return toast.error(`Item "${_data.itemName}" exists on the order.`);
    }
    await removeItemFromSortedChecked(_data.item, _data.quantity);
    doc
      .save(_data)
      .then(() => {
        toast.success(`Purchase was ${instance ? "updated" : "recorded"}`);
      })
      .catch((e) => toast.error(`Error: ${e.message}`));
  };

  if (invoice?.confirmed || invoice?.canceled)
    return (
      <p>
        Order was {invoice.confirmed ? "confirmed" : "cancelled"}, it can't be
        updated.
      </p>
    );

  return (
    <DynamicForm
      instance={instance}
      // multiLevel={true}
      additionValidationModal={(message) => {
        return <div className="text-red-500 my-5">{message}</div>;
      }}
      additionValidation={async (data) => {
        let { item, quantity, itemName } = data;
        let ItemToCheckQuery = query(
          SortedCheckedEmptiesQuery.ref,
          where("item", "==", item)
        );
        let docs = await getDocs(ItemToCheckQuery);
        let noitems = {
          status: false,
          message: "No Empties found for " + itemName,
        };
        if (docs.empty) {
          return noitems;
        }
        if (docs.size === 0) {
          return noitems;
        }
        let doc = docs.docs[0];
        if (!doc) {
          return noitems;
        }
        let docData = doc.data();
        if (!docData) {
          return noitems;
        }
        if (instance) {
          if (instance.item === item) {
            if (instance.quantity === quantity) {
              return { status: true };
            }
            let additionalQuantity = quantity - instance.quantity;
            if (additionalQuantity < 0) {
              return { status: true };
            }
            if (docData.quantity === 0 ) {
              return {
                status: false,
                message: `No Empties can be added`,
              };
            }
            if (additionalQuantity > docData.quantity) {
              return {
                status: false,
                message: `Only ${docData.quantity} Empties can be added`,
              };
            }
          }
        }

        if (docData.quantity === 0) {
          return {
            status: false,
            message: `${docData.itemName}'s Empties is out of stock`,
          };
        }
        if (docData.quantity < quantity) {
          return {
            status: false,
            message: `Only ${docData.quantity} Empties are available`,
          };
        }
        return { status: true };
      }}
      // inputsPerLevel={5}
      // hiddenInputs={1}
      schema={purchaseSchema}
      onSubmit={handleCreatePurchase}
      refineCallbacks={[
        {
          fn: (data) => data.unitPrice <= data.sellingPrice,
          args: {
            message: "Selling price can't be lower than unit price",
            path: ["sellingPrice"],
          },
        },
        // { fn: refineMinPriceCallback, args: refineMinPriceArgs },
        // { fn: refineQuantitiesMatch, args: quantiesMatchArgs },
      ]}
      metadata={{
        itemName: {
          hidden: true,
        },
        total: {
          watchFields: ["quantity", "unitPrice"],
          calculate({ fields, setValue }) {
            const [qty, uPrice] = fields;
            setValue("total", Number(((qty || 0) * (uPrice || 0)).toFixed(2)));
          },
        },
        nonTaxableAmount: { hidden: true },
        unitPrice: { label: "Purchase Unit Price" },
        taxAmount: {
          watchFields: ["taxCode", "total", "nonTaxableAmount", "quantity"],
          calculate({ fields, value, setValue }) {
            const [taxCode, tot, nonTaxableAmount, quantity] = fields;
            if (taxCode !== "B") return setValue("taxAmount", 0);

            if (tot == 0) return;
            setValue(
              "taxAmount",
              Number(
                (
                  ((tot - (nonTaxableAmount ?? 0) * (quantity ?? 0) || 0) *
                    18) /
                  118
                ).toFixed(2)
              )
            );
          },
        },
        item: {
          label: "",
          display: "name",
          query: itemsQuery,
          value: "id",
          addForm: <ItemsCreateForm />,
          onSelect(record, setValue) {
            setValue("itemName", record.name);
            setValue("taxCode", record.taxCode);
            setValue(
              "unitPrice",
              instance?.unitPrice ?? (record as Item).purchaseUnitPrice ?? 0
            );
            setValue(
              "sellingPrice",
              instance?.unitPrice ?? (record as Item).sellingUnitPrice ?? 0
            );
            setValue(
              "nonTaxableAmount",
              (record as Item).nonTaxableAmount ?? 300
            );
          },
          getUpdateForm(instance) {
            return <ItemsCreateForm instance={instance} />;
          },
          canSearchQuery: true,
        },
      }}
    />
  );
};

export function getOptions({
  choices,
  display,
  hidden = "id",
}: {
  choices: Array<any>;
  display: string;
  hidden?: string;
}) {
  return choices.reduce((p, c) => {
    if (!c) return p;
    p[c[hidden] as string] = c[display];
    return p;
  }, {} as { [k: string]: any });
}

export default withAuthorization({
  requiredClaims: { manager: true, admin: true },
  all: false,
})(PurchaseForm);
