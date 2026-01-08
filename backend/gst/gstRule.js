export function determineGSTType(merchantState, customerState) {
  if (!merchantState || !customerState) return "UNKNOWN";

  if (merchantState === customerState) return "CGST_SGST";

  return "IGST";
}

export const GST_RATE = 0.18;
