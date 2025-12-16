import PaytmChecksum from "paytmchecksum";

const body = {
  requestType: "Payment",
  mid: "qbVqyL16782588779810",
  websiteName: "WEBSTAGING",
  orderId: "ORD12345",
  txnAmount: { value: "1.00", currency: "INR" },
  userInfo: { custId: "test@test.com" },
  callbackUrl: "https://example.com",
};

const sig = await PaytmChecksum.generateSignature(
  JSON.stringify(body),
  "jA3uM%GhvBUrCuLj"
);

console.log(sig);
