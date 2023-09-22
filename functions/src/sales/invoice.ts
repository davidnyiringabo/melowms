import * as functions from 'firebase-functions';
import * as PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import axios from 'axios';

type InvoiceInfo = {
  total: number;
  items: [
    { name: string; unitPrice: number; quantity: number; total: number },
    { name: string; unitPrice: number; quantity: number; total: number }
  ];
  orderCount: number;
  itemCount: number;
  companyName: string;
  customerName: string;
  date: string;
  employeeName: string;
};

export const generateInvoicePDF = functions.https.onCall(
  async (data: InvoiceInfo, context) => {
    try {
      return new Promise(async (resolve, reject) => {
        const imageUrl = 'https://melo-wms-stage.web.app/icon-96x96.png'; // Replace with your image URL

        // Fetch the image using axios
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });

        // Create a new PDF document
        const doc = new PDFDocument();

        // Create a buffer to store the generated PDF
        const buffers: Buffer[] = [];

        // Pipe the PDF document to the buffer
        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => {
          // Concatenate the PDF buffers into a single buffer
          const pdfBuffer = Buffer.concat(buffers);

          // Return the PDF buffer
          resolve(pdfBuffer.toString('base64'));
        });

        // Set document properties and metadata
        doc.info.Title = 'Invoice';
        doc.info.Author = 'Melo WMS';

        // Set padding
        const padding = 16;
        // Set the font size
        const fontSize = 16;

        const defaultInfo = {
          logoUrl: imageResponse.data,
          smallText: 'Melo WMS',
          title: 'Invoice',
          invoiceNumber: 'INV-' + data.orderCount,
          date: data.date,
          companyName: data.companyName,
        };
        // Define dummy data
        const invoiceData = {
          ...defaultInfo,
          ...data,
        };

        // Calculate the available width for the text on the right
        const availableWidth = doc.page.width - padding * 2 - (200 + 40);

        // Set the initial y-coordinate
        let y = padding;

        // Draw the logo on the left
        doc.image(invoiceData.logoUrl, padding, y, { width: 96, height: 96 });
        y += 100 + padding;

        // Draw the small text below the logo
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize + 4)
          .text(invoiceData.smallText, padding, y, { wordSpacing: 1 });
        y += fontSize + padding;

        // Draw the title, invoice number, date, and company name on the right
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize)
          .text(
            invoiceData.title,
            doc.page.width - availableWidth - padding,
            y,
            { width: availableWidth, align: 'right' }
          );
        y += fontSize + padding;

        doc
          .font('Helvetica')
          .fontSize(fontSize)
          .text(
            `Invoice Number: ${invoiceData.invoiceNumber}`,
            doc.page.width - availableWidth - padding,
            y,
            { width: availableWidth, align: 'right' }
          );
        y += fontSize + padding;

        doc
          .font('Helvetica')
          .fontSize(fontSize)
          .text(
            `Date: ${invoiceData.date}`,
            doc.page.width - availableWidth - padding,
            y,
            { width: availableWidth, align: 'right' }
          );
        y += fontSize + padding;

        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize + 2)
          .text(
            invoiceData.companyName,
            doc.page.width - availableWidth - padding,
            y,
            { width: availableWidth, align: 'right' }
          );
        y += fontSize + padding;

        // Draw the line with the total
        doc
          .moveTo(padding, y)
          .lineTo(doc.page.width - padding, y)
          .stroke();
        y += padding;

        // Draw the overall total
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize + 5)
          .text(`Overall total: ${invoiceData.total.toFixed(2)}`, padding, y);
        y += fontSize + padding + 5;

        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize)
          .text(`Item: price x quantity`, padding, y);
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize)
          .text(`Total`, doc.page.width - availableWidth - padding, y, {
            width: availableWidth,
            align: 'right',
          });
        y += fontSize + padding;
        // Draw the list of items on the invoice
        invoiceData.items.forEach((item) => {
          doc
            .font('Helvetica')
            .fontSize(fontSize)
            .text(
              `${item.name}: ${item.unitPrice.toFixed(2)} x ${item.quantity}`,
              padding,
              y
            );
          doc
            .font('Helvetica-Bold')
            .fontSize(fontSize)
            .text(
              ` ${item.total.toFixed(2)}`,
              doc.page.width - availableWidth - padding,
              y,
              { width: availableWidth, align: 'right' }
            );
          y += fontSize + padding;
        });

        y += 10;
        // Draw the customer name
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize)
          .text(`Customer: ${invoiceData.customerName}`, padding, y);
        y += fontSize + padding;

        // Draw the employee name
        doc
          .font('Helvetica-Bold')
          .fontSize(fontSize)
          .text(`Done  by: ${invoiceData.employeeName}`, padding, y);

        // Finalize the PDF document
        doc.end();
      });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error generating invoice PDF'
      );
    }
  }
);
