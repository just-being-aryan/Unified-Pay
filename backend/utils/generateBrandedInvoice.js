import PDFDocument from "pdfkit";

export const generateBrandedInvoice = (transaction) => {
  const doc = new PDFDocument({ margin: 50 });

  /* HEADER */
  doc
    .fontSize(26)
    .fillColor("#3F00FF")
    .text("UniPay", { align: "left" })
    .moveDown(1);

  /* INVOICE TITLE */
  doc
    .fontSize(18)
    .fillColor("#000")
    .text("Payment Invoice", { align: "left" })
    .moveDown(1.5);

  /* BASIC INFO */
  const createdAt = new Date(transaction.createdAt).toLocaleString();
  const verifiedAt = transaction.verifiedAt
    ? new Date(transaction.verifiedAt).toLocaleString()
    : "-";

  doc
    .fontSize(12)
    .fillColor("#444")
    .text(`Invoice No: ${transaction.transactionId}`)
    .text(`Date Issued: ${createdAt}`)
    .text(`Status: ${transaction.status}`)
    .moveDown(1.5);

  /* CUSTOMER INFO */
  const customerName = transaction.paymentInfo?.customerName || "N/A";
  const customerEmail = transaction.paymentInfo?.customerEmail || "N/A";
  const customerPhone = transaction.paymentInfo?.customerPhone || "N/A";

  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Billed To", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`Name: ${customerName}`)
    .text(`Email: ${customerEmail}`)
    .text(`Phone: ${customerPhone}`)
    .moveDown(2);

  /* PAYMENT SUMMARY */
  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Payment Summary", { underline: true })
    .moveDown(1);

  // Row
  doc.rect(50, doc.y - 5, 500, 30).fill("#f8f8f8").stroke();
  doc
    .fillColor("#000")
    .fontSize(12)
    .text(`Payment via ${transaction.gateway}`, 60, doc.y - 22)
    .text(`₹${transaction.amount}`, 480, doc.y - 22, { width: 60, align: "right" });

  doc.moveDown(2);

  /* TRANSACTION DETAILS */
  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Transaction Details", { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`Gateway: ${transaction.gateway}`)
    .text(`Gateway Payment ID: ${transaction.gatewayPaymentId || "N/A"}`)
    .text(`Internal Txn ID: ${transaction.transactionId}`)
    .text(`Verified At: ${verifiedAt}`)
    .moveDown(3);

  /* FOOTER */
  doc
    .fontSize(11)
    .fillColor("#777")
    .text("This is a system-generated invoice.", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor("#3F00FF")
    .text("Powered by UniPay", { align: "center" });

  doc.end();
  return doc;
};
