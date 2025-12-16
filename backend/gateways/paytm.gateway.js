// backend/gateways/paytm.gateway.js
import axios from "axios";
import PaytmChecksum from "paytmchecksum";

export const requiredFields = [
  "PAYTM_MID",
  "PAYTM_MERCHANT_KEY",
  "PAYTM_MERCHANT_WEBSITE",
];

function resolvePaytmConfig(config = {}) {
  const MID =
    config.PAYTM_MID ||
    config.mid ||
    process.env.PAYTM_MID;

  const MERCHANT_KEY =
    config.PAYTM_MERCHANT_KEY ||
    config.merchantKey ||
    process.env.PAYTM_MERCHANT_KEY;

  const WEBSITE =
    config.PAYTM_MERCHANT_WEBSITE ||
    config.website ||
    process.env.PAYTM_MERCHANT_WEBSITE ||
    "WEBSTAGING";

  const BASE_URL =
    process.env.PAYTM_BASE_URL || "https://securegw-stage.paytm.in";

  if (!MID || !MERCHANT_KEY) {
    throw new Error("Paytm credentials missing");
  }

  return { MID, MERCHANT_KEY, WEBSITE, BASE_URL };
}

export default {
  // =========================================================
  // INITIATE PAYMENT
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const {
        amount,
        customer = {},
        redirect = {},
        currency = "INR",
        config = {},
      } = input;

      const cfg = resolvePaytmConfig(config);

     
      const ORDERID = `ORD${Date.now()}`;

      const paytmBody = {
        requestType: "Payment",
        mid: cfg.MID,
        websiteName: cfg.WEBSITE,
        orderId: ORDERID,

        
        channelId: "WEB",
        industryTypeId: "Retail",

        callbackUrl: redirect.successUrl,

        txnAmount: {
          value: Number(amount).toFixed(2),
          currency,
        },
        userInfo: {
          custId: customer.email || ORDERID,
        },
      };

      
      const signature = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmBody),
        cfg.MERCHANT_KEY
      );

      const paytmParams = {
        body: paytmBody,
        head: { signature },
      };

      const url = `${cfg.BASE_URL}/theia/api/v1/initiateTransaction?mid=${cfg.MID}&orderId=${ORDERID}`;

      const { data } = await axios.post(url, paytmParams, {
        headers: { "Content-Type": "application/json" },
      });

      // ✅ LOG RAW PAYTM RESPONSE IF FAILURE
      if (!data?.body?.txnToken) {
        console.error(
          "PAYTM INITIATE RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        return {
          ok: false,
          message: "Paytm did not return txnToken",
          raw: data,
        };
      }

      return {
        ok: true,
        message: "Paytm initiate success",
        data: {
          paymentMethod: "paytm_js",
          mid: cfg.MID,
          orderId: ORDERID,
          txnToken: data.body.txnToken,
          amount: Number(amount).toFixed(2),
          currency,
          gatewayOrderId: ORDERID,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: "Paytm initiate failed",
        raw: err?.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================
  verifyPayment: async ({ callbackPayload, config }) => {
    try {
      const ORDERID =
        callbackPayload?.ORDERID ||
        callbackPayload?.orderId ||
        callbackPayload?.order_id;

      const cfg = resolvePaytmConfig(config);

      const body = {
        mid: cfg.MID,
        orderId: ORDERID,
      };

      const signature = await PaytmChecksum.generateSignature(
        JSON.stringify(body),
        cfg.MERCHANT_KEY
      );

      const payload = {
        body,
        head: { signature },
      };

      const statusURL = `${cfg.BASE_URL}/v3/order/status`;

      const { data } = await axios.post(statusURL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const result = data?.body;
      const rawStatus = result?.resultInfo?.resultStatus;

      let status = "processing";
      if (rawStatus === "TXN_SUCCESS") status = "paid";
      if (rawStatus === "TXN_FAILURE") status = "failed";

      return {
        ok: true,
        message: "Paytm verified",
        data: {
          status,
          gatewayPaymentId: result?.txnId || null,
          amount: result?.txnAmount
            ? Number(result.txnAmount)
            : null,
        },
        raw: data,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Paytm verify failed",
        raw: err?.response?.data || err.message,
      };
    }
  },

  extractReference: (payload) =>
    payload?.ORDERID ||
    payload?.orderId ||
    payload?.order_id ||
    null,

  refundPayment: async () => ({
    ok: false,
    message: "Paytm refund not implemented",
  }),
};
