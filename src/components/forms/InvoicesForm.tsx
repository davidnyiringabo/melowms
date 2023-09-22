import { z } from 'zod';
import DynamicForm from './Form';
import { useCustomAuth } from '../../context/Auth';
import withAuthorization from '../hocs/withAuthorization';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { DocNode, Invoices, Suppliers } from '../../database';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import SupplierForm from './SupplierForm';
import { Supplier } from '../../types';
import { fieldValueExists } from './sales/CustomerForm';

const taxCategorySchema = z.object({
  taxableAmount: z.number().default(0),
  taxRate: z.number().default(0.18),
  taxAmount: z.number().default(0),
});

const OtherInvoiceFieldsSchema = z.object({
  taxA: taxCategorySchema,
  taxB: taxCategorySchema,
  taxC: taxCategorySchema,
  taxD: taxCategorySchema,
  totalTaxableAmount: z.number().default(0),
  totalTaxAmount: z.number().default(0),
  DebitAmount: z.number().default(1),
  DebitPaidAmount: z.number().default(1),
  purchaseSent: z.literal(false),
});

const invoiceSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required').describe('query'),
  orderNumber: z.string().min(1),
  // invoiceNumber: z.string().min(1),
  supplierSDCId: z.string().min(1).describe('select'),
  paymentMethod: z.literal('BANK'),
  shipmentDate: z.date().default(new Date()),
  purchaseDate: z.date().default(new Date()),
  supplierName: z.string(),
  supplierBranch: z.string(),
  // paymentDate: z.date().default(new Date()),
  canceled: z.literal(false),
  confirmed: z.literal(false),
  saved: z.literal(false),
});

const InvoicesForm = ({
  instance,
  onCreated,
}: {
  instance?: { [k: string]: any };
  onCreated?: (id: string) => void;
}) => {
  const { isAdmin, tinnumber, Branch, isManager } = useCustomAuth();

  const firestore = useFirestore();
  const suppliersQuery = query(
    collectionGroup(firestore, Suppliers.name),
    where('path.companies', '==', tinnumber)
  );

  const handleCreateInvoice: SubmitHandler<
    z.infer<typeof finalSchema>
  > = async (data) => {
    const invoicesCol = (Branch as DocNode)
      .sub(Suppliers)
      .doc(data.supplier)
      .sub(Invoices);

    if (!instance) {
      const orderNumberExists = await fieldValueExists({
        collection: invoicesCol.ref,
        fieldName: 'orderNumber',
        value: data.orderNumber,
      });
      // const invoiceNumberExists =
      //   !orderNumberExists &&
      //   (await fieldValueExists({
      //     collection: invoicesCol.ref,
      //     fieldName: 'invoiceNumber',
      //     value: data.invoiceNumber,
      //   }));

      if (orderNumberExists) {
        toast.error(
          `Order with order number "${data.orderNumber}" already exists!`
        );
        return Promise.reject();
      }
      // else if (invoiceNumberExists) {
      //   toast.error(
      //     `Order with invoice number "${data.invoiceNumber}" already exists!`
      //   );
      // }
      else {
        const docNode = await invoicesCol.addDoc({ ...data, saved: false });
        onCreated && onCreated(docNode.id);
        return;
      }
    } else {
      await Branch?.sub(Suppliers)
        .doc(data.supplier)
        .sub(Invoices)
        .doc(instance.id)
        .save(data);
    }
  };

  const finalSchema = instance
    ? invoiceSchema.extend({
        purchaseDate: z
          .date()
          .default((instance.purchaseDate as any)?.toDate() as Date),
        // paymentDate: z
        //   .date()
        //   .default((instance.paymentDate as any)?.toDate() as Date),
      })
    : invoiceSchema;

  if (instance?.confirmed) {
    return <p>Order was confirmed, it can't be updated.</p>;
  }
  if (instance?.canceled) {
    return <p>Order was cancelled, it can't be updated.</p>;
  }

  return (
    <DynamicForm
      instance={instance}
      onSubmit={handleCreateInvoice}
      schema={finalSchema}
      metadata={{
        // invoiceNumber: { helpText: 'Invoice number you received' },
        supplierName: { hidden: true },
        supplierBranch: { hidden: true },
        supplier: {
          warningText: "You can't change the supplier later.",
          canSearchQuery: true,
          addForm: <SupplierForm />,
          getUpdateForm: (sup) => <SupplierForm supplier={sup as Supplier} />,
          searchField: 'name',
          query: suppliersQuery,
          display: 'name',
          onSelect(record, setValue, modifyFieldMeta) {
            setValue('supplierName', record.name);
            setValue('supplierBranch', record?.path?.branches ?? '');

            const newOptions = (record.SDCIds as { sdcId: string }[]).reduce(
              (acc, c) => {
                acc[c.sdcId] = c.sdcId;
                return acc;
              },
              {} as { [k: string]: any }
            );

            modifyFieldMeta('supplierSDCId', {
              options: newOptions,
            });
          },
        },
        supplierSDCId: {
          onlyOptions: true,
          options: {},
          watchFields: ['supplier'],

          // calculate: async ({ fields, setValue, modifyFieldMeta, fMeta }) => {
          //   const [supplier] = fields;
          //   if (!supplier) return;
          //   const data = (
          //     await Branch?.sub(Suppliers).doc(supplier).get()
          //   )?.data() as Supplier;
          //   if (!data) return;

          //   if (objectEquals(newOptions, fMeta.options || {})) return;
          //   setValue('supplierSDCId', data.SDCIds[0]);
          // },
        },
      }}
    />
  );
};

export default withAuthorization({
  requiredClaims: { superAdmin: false, manager: true, admin: true },
  all: false,
})(InvoicesForm);

export function objectEquals(o1: object, o2: object) {
  return JSON.stringify(o1) === JSON.stringify(o2);
}
