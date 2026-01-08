import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateBrandedInvoice = async (transaction) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  const LEFT = 50;
  const RIGHT = 300;
  let y = 50;

  const row = (label, value) => {
    doc.fontSize(12).fillColor("#333").text(label, LEFT, y);
    doc.text(value, RIGHT, y, { width: 240, lineBreak: false });
    y += 18;
  };

  doc.fontSize(26).fillColor("#3F00FF").text("UniPay", LEFT, y);
  y += 34;

  doc.fontSize(20).fillColor("#000").text("Payment Invoice", LEFT, y);
  y += 28;

  const createdAt = new Date(transaction.createdAt).toLocaleString();
  const verifiedAt = transaction.verifiedAt
    ? new Date(transaction.verifiedAt).toLocaleString()
    : "-";

  doc.fontSize(11).fillColor("#555").text(
    `Invoice No: ${
      transaction.gst?.enabled
        ? transaction.gst.invoiceNumber
        : transaction.transactionId
    }`,
    LEFT,
    y
  );
  y += 14;
  doc.text(`Date Issued: ${createdAt}`, LEFT, y);
  y += 14;
  doc.text(`Status: ${transaction.status}`, LEFT, y);
  y += 22;

  doc.fontSize(14).fillColor("#000").text("Billed To", LEFT, y);
  y += 18;

  row("Name", transaction.customer?.name || "N/A");
  row("Email", transaction.customer?.email || "N/A");
  row("Phone", transaction.customer?.phone || "N/A");

  y += 14;
  doc.fontSize(14).fillColor("#000").text("Payment Summary", LEFT, y);
  y += 18;

  row("Description", `Payment via ${transaction.gateway}`);
  row("Amount", `INR ${transaction.amount}`);

  y += 14;
  doc.fontSize(14).fillColor("#000").text("Transaction Details", LEFT, y);
  y += 18;

  row("Gateway", transaction.gateway);
  row("Gateway Payment ID", transaction.gatewayPaymentId || "N/A");
  row("Internal Txn ID", transaction.transactionId);
  row("Verified At", verifiedAt);

  if (transaction.gst?.enabled) {
    y += 14;
    doc.fontSize(14).fillColor("#000").text("GST Summary", LEFT, y);
    y += 18;

    row("Taxable Value", `INR ${transaction.gst.taxes.taxableValue}`);
    row("CGST", `INR ${transaction.gst.taxes.cgst}`);
    row("SGST", `INR ${transaction.gst.taxes.sgst}`);
    row("Total Tax", `INR ${transaction.gst.taxes.totalTax}`);
    row("Grand Total", `INR ${transaction.gst.taxes.grandTotal}`);

    y += 14;
    doc.fontSize(14).fillColor("#000").text("IRN Details", LEFT, y);
    y += 18;

    doc.fontSize(12).fillColor("#333").text("IRN", LEFT, y);
    y += 16;

    doc
      .fontSize(11)
      .fillColor("#333")
      .text(transaction.gst.irn.number, LEFT, y, {
        width: doc.page.width - 100,
        lineBreak: false,
      });

    y += 20;

    row("ACK No", transaction.gst.irn.ackNo);
    row(
      "ACK Date",
      new Date(transaction.gst.irn.ackDate).toLocaleString()
    );



  }

  if (transaction.gst?.irn?.qrCode) {
    const qr = await QRCode.toBuffer(transaction.gst.irn.qrCode, {
      width: 120,
      margin: 0,
    });

    doc.image(qr, doc.page.width - 170, 50, { width: 120 });
  }

  doc
  .fontSize(10)
  .fillColor("#777")
  .text(
    "This is a system-generated invoice.",
    LEFT,
    doc.page.height - 90,
    { align: "center" }
  );

doc
  .fontSize(12)
  .fillColor("#3F00FF")
  .text(
    "Powered by UniPay",
    LEFT,
    doc.page.height - 70,
    { align: "center" }
  );

  doc.end();
  return doc;
};
