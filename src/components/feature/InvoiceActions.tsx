import { useState } from 'react';
import { Invoice } from '../../types';
import { MdOutlineChangeCircle } from 'react-icons/md';
import { DocNode } from '../../database';
import { DocumentReference } from 'firebase/firestore';
import Modal from '../Modal';
import ReplaceInvoiceForm, {
  replaceInvoiceSchema,
} from '../forms/sales/ReplaceInvoiceForm';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { fieldValueExists } from '../forms/sales/CustomerForm';

const InvoiceActions = ({
  invoice,
  invoiceDoc,
}: {
  invoice: Invoice;
  invoiceDoc: DocNode;
}) => {
  const [canReplace, setCanReplace] = useState(false);

  const invoiceRef = invoiceDoc.ref as DocumentReference<Invoice>;
  const invoicesRef = invoiceRef.parent;

  const handleReplaceInvoice: SubmitHandler<
    z.infer<typeof replaceInvoiceSchema>
  > = async (data) => {
    const orderNumberExists = await fieldValueExists({
      collection: invoicesRef,
      fieldName: 'orderNumber',
      value: data.orderNumber,
    });

    if (orderNumberExists) {
      toast.error(
        `Order with order number "${data.orderNumber}" already exists!`
      );
      return Promise.reject();
    }

    const prevId = invoice.id;
    delete (invoice as any).id;

    await invoiceDoc.collection.addDoc<
      Omit<
        Invoice,
        | 'createdTime'
        | 'path'
        | 'paymentDate'
        | 'id'
        | 'path'
        | 'paymentDate'
        | 'paymentMethod'
        | 'invoiceNumber'
      >
    >({
      purchaseDate: invoice.purchaseDate,
      supplierBranch: invoice.supplierBranch,
      shipmentDate: invoice.shipmentDate,
      supplier: invoice.supplier,
      supplierName: invoice.supplierName,
      totalCost: 0,
      paidAmount: 0,
      totalItemCount: 0,
      totalQuantity: 0,
      totalTaxableAmount: 0,
      totalTaxAmount: 0,
      saved: false,
      prevCount: (invoice.prevCount ?? 0) + 1,
      prevOrderNumber: invoice.orderNumber,
      orderNumber: data.orderNumber,
      prevId,
      confirmed: false,
      canceled: false,
      supplierSDCId: invoice.supplierSDCId,
    });
    await invoiceDoc.save({ saved: true, canceled: true });
  };

  return invoice.totalItemCount ? (
    <div className="flex items-center gap-1">
      {/* <button className="btn bg-red-400 focus:ring-red-500 hover:bg-red-600">
        <MdClose /> Cancel
      </button> */}
      {canReplace && (
        <Modal
          open={canReplace}
          onClose={() => setCanReplace(false)}
          title="Replace Order"
        >
          <div className="text-black">
            <ReplaceInvoiceForm replaceInvoice={handleReplaceInvoice} />
          </div>
        </Modal>
      )}
      <button
        onClick={() => setCanReplace(true)}
        className="btn bg-red-400 focus:ring-red-500 hover:bg-red-600"
      >
        <MdOutlineChangeCircle /> Replace
      </button>
    </div>
  ) : (
    <></>
  );
};

export default InvoiceActions;
