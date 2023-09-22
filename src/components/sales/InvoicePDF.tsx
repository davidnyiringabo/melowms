import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { useFunctions } from 'reactfire';
import cloudFunctionNames from '../../functionNames';
import Spinner from '../Spinner';
import { InvoiceInfo, Order } from '../../types';
import { useCustomAuth } from '../../context/Auth';
import { Company } from '../../routes/manage/companies';
import { toast } from 'react-hot-toast';

const InvoiceGenerator = ({ order }: { order: Order }) => {
  const { currentUser, company } = useCustomAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);

  const generateInvoicePDF = async () => {
    try {
      const generateInvoicePDF = httpsCallable<InvoiceInfo, unknown>(
        functions,
        cloudFunctionNames.generateInvoicePDF
      );
      setLoading(true);
      const result = await generateInvoicePDF({
        companyName: (company as Company).name,
        customerName: order.customerName,
        date: new Date().toLocaleString('en-rw'),
        employeeName: currentUser?.displayName as string,
        total: order.totalCost,
        itemCount: order.totalItems,
        orderCount: order.orderCount ?? Math.floor(Math.random() * 100 + 1),
        items: order.items.map((it) => ({
          name: it.itemName,
          unitPrice: it.unitPrice,
          total: it.totalPrice,
          quantity: it.quantity,
        })),
      });

      const pdfBuffer = base64ToArrayBuffer(result.data);

      // Convert the base64-encoded string to a Blob
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      // Create a URL object from the Blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Set the PDF URL in state
      setPdfUrl(pdfUrl);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error('Error generating invoice PDF:' + (error.message ?? ''));
      console.error('Error generating invoice PDF:', error);
    }
  };

  // Utility function to convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: any) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <div>
      <button
        disabled={loading}
        className="btn my-3"
        onClick={generateInvoicePDF}
      >
        {loading && <Spinner small />}
        <span> Generate Invoice PDF</span>
      </button>
      {pdfUrl && (
        <iframe src={pdfUrl} title="Invoice PDF" width="100%" height="500px" />
      )}
    </div>
  );
};

export default InvoiceGenerator;
