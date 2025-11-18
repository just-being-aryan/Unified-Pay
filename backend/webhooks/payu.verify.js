// PayU webhook does NOT use signature verification
// We simply normalize the data into a standard format

export default function payuVerify(payload) {
  if (!payload) throw new Error("Empty PayU webhook payload");

  const orderId = payload.txnid || payload.ORDERID || payload.orderId;
  const gatewayPaymentId = payload.mihpayid || payload.PAYID || null;

  let status = "processing";

  if (payload.status?.toLowerCase() === "success") status = "paid";
  if (payload.status?.toLowerCase() === "failure") status = "failed";

  return {
    orderId,
    gatewayPaymentId,
    status,
    amount: payload.amount || payload.AMOUNT || null,
  };
}
