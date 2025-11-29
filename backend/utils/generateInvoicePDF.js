import PDFDocument from "pdfkit";

export const generateInvoicePDF = (transaction) => {
  const doc = new PDFDocument({ margin: 40 });

  doc.fontSize(22).text("Payment Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(14).text(`Status: ${transaction.status}`);
  doc.text(`Amount: ₹${transaction.amount}`);
  doc.text(`Internal Txn ID: ${transaction.transactionId}`);
  doc.text(`Gateway: ${transaction.gateway}`);
  doc.text(`Gateway Payment ID: ${transaction.gatewayPaymentId || "-"}`);
  doc.text(`Verified At: ${transaction.verifiedAt || "-"}`);
  doc.text(`Created At: ${transaction.createdAt}`);

  doc.end();
  return doc;
};
