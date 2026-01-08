import { determineGSTType, GST_RATE } from "./gstRules.js";

export function applyGST({ amount, merchantState, customerState }) {
  const type = determineGSTType(merchantState, customerState);

  const baseAmount = Number(amount) || 0;
  const gstTotal = +(baseAmount * GST_RATE).toFixed(2);

  if (type === "CGST_SGST") {
    const half = +(gstTotal / 2).toFixed(2);

    return {
      type,
      taxableValue: baseAmount,
      cgst: half,
      sgst: half,
      igst: 0,
      total: +(baseAmount + gstTotal).toFixed(2),
    };
  }

  if (type === "IGST") {
    return {
      type,
      taxableValue: baseAmount,
      cgst: 0,
      sgst: 0,
      igst: gstTotal,
      total: +(baseAmount + gstTotal).toFixed(2),
    };
  }

  return {
    type,
    taxableValue: baseAmount,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: baseAmount,
  };
}
