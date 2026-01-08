import Transaction from "../models/transaction.model.js";
import crypto from "crypto";

export const createGSTInvoice = async (txn, project) => {
  project.gstConfig.invoice.lastNumber += 1;
  const number = project.gstConfig.invoice.lastNumber;

  const year = new Date().getFullYear().toString().slice(-2);
  const nextYear = (parseInt(year) + 1).toString();

  const invoiceNumber = `${project.gstConfig.invoice.prefix}/${year}-${nextYear}/${String(number).padStart(6, "0")}`;

  project.markModified("gstConfig.invoice");
  await project.save();

  const taxableValue = txn.amount / 1.18;
  const totalTax = txn.amount - taxableValue;

  txn.gst = {
    enabled: true,
    invoiceNumber,
    taxes: {
      taxableValue: Math.round(taxableValue),
      cgst: Math.round(totalTax / 2),
      sgst: Math.round(totalTax / 2),
      igst: 0,
      totalTax: Math.round(totalTax),
      grandTotal: txn.amount
    }
  };

  await txn.save();
  return txn;
};

export const generateSandboxIRN = async (txn) => {
  const irnHash = crypto
    .createHash("sha256")
    .update(`${txn.transactionId}-${txn.gst.invoiceNumber}`)
    .digest("hex");

  txn.gst.irn = {
    number: irnHash,
    ackNo: Math.floor(Math.random() * 1e9).toString(),
    ackDate: new Date(),
    qrCode: `SANDBOX-QR-${irnHash.slice(0, 12)}`,
    status: "GENERATED",
    rawResponse: {}
  };

  await txn.save();
  return txn;
};
