import PDFDocument from "pdfkit";

export const generateBrandedInvoice = (transaction) => {
  const doc = new PDFDocument({ margin: 50 });

  /* ---------------------------------------------- */
  /* HEADER                                         */
  /* ---------------------------------------------- */
  doc
    .fontSize(26)
    .fillColor("#3F00FF")
    .text("UniPay");

  doc.moveDown(1.5);

  /* ---------------------------------------------- */
  /* TITLE                                          */
  /* ---------------------------------------------- */
  doc
    .fontSize(20)
    .fillColor("#000")
    .text("Payment Invoice");

  doc.moveDown(1);

  const createdAt = new Date(transaction.createdAt).toLocaleString();
  const verifiedAt = transaction.verifiedAt
    ? new Date(transaction.verifiedAt).toLocaleString()
    : "-";

  /* ---------------------------------------------- */
  /* BASIC META INFO                                */
  /* ---------------------------------------------- */
  doc
    .fontSize(12)
    .fillColor("#555")
    .text(`Invoice No: ${transaction.transactionId}`)
    .text(`Date Issued: ${createdAt}`)
    .text(`Status: ${transaction.status}`);

  doc.moveDown(2);

  /* ---------------------------------------------- */
  /* BILLED TO                                      */
  /* ---------------------------------------------- */
   const customerName = transaction.customer?.name || "N/A";
   const customerEmail = transaction.customer?.email || "N/A";
   const customerPhone = transaction.customer?.phone || "N/A";

  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Billed To", { underline: true });

  doc.moveDown(0.7);

  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`Name: ${customerName}`)
    .text(`Email: ${customerEmail}`)
    .text(`Phone: ${customerPhone}`);

  doc.moveDown(2);

  /* ---------------------------------------------- */
  /* PAYMENT SUMMARY BOX                            */
  /* ---------------------------------------------- */
  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Payment Summary", { underline: true });

  doc.moveDown(0.8);

  // Box area
  const boxX = 50;
  const boxY = doc.y;
  const boxWidth = 500;
  const rowHeight = 30;

  // Header row
  doc
    .rect(boxX, boxY, boxWidth, rowHeight)
    .fill("#f5f5f5")
    .stroke();

  // Text inside header row
  doc
    .fillColor("#000")
    .fontSize(12)
    .text("Description", boxX + 10, boxY + 10)
    .text("Amount", boxX + boxWidth - 60, boxY + 10);

  // Move cursor BELOW the box
  doc.y = boxY + rowHeight + 10;

  // Actual payment row
  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`Payment via ${transaction.gateway}`, boxX + 10, doc.y)
    .text(`₹${transaction.amount}`, boxX + boxWidth - 60, doc.y);

  doc.moveDown(3);

  /* ---------------------------------------------- */
  /* TRANSACTION DETAILS (FIXED LEFT ALIGN)          */
  /* ---------------------------------------------- */
  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Transaction Details", { underline: true });

  doc.moveDown(0.8);

  // RESET X to left margin ALWAYS
  const startX = 50;

  doc
    .fontSize(12)
    .fillColor("#333")
    .text(`Gateway: ${transaction.gateway}`, startX)
    .text(
      `Gateway Payment ID: ${transaction.gatewayPaymentId || "N/A"}`,
      startX
    )
    .text(`Internal Txn ID: ${transaction.transactionId}`, startX)
    .text(`Verified At: ${verifiedAt}`, startX);

  doc.moveDown(3);

  /* ---------------------------------------------- */
  /* FOOTER                                         */
  /* ---------------------------------------------- */
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

