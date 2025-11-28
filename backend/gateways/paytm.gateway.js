/* eslint-env node */

import axios from "axios";
import crypto from "crypto";

export default {
  // =========================================================
  // INITIATE PAYMENT (TxnToken Flow)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const MID = process.env.PAYTM_MID;
      const MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
      const WEBSITE = process.env.PAYTM_MERCHANT_WEBSITE || "WEBSTAGING";

      if (!MID || !MERCHANT_KEY) {
        return { ok: false, message: "Missing MID or Merchant Key" };
      }

      const {
        amount,
        transactionId,
        customer,
        redirect,
        currency = "INR",
      } = input;

      const ORDERID = `ORD${Date.now()}${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      const paytmBody = {
        requestType: "Payment",
        mid: MID,
        websiteName: WEBSITE,
        orderId: ORDERID,
        callbackUrl: redirect.notifyUrl,
        txnAmount: {
          value: Number(amount).toFixed(2),
          currency,
        },
        userInfo: {
          custId: customer?.email || "guest@example.com",
        },
      };

      // ✔ Correct signature generation
      const checksum = crypto
        .createHmac("sha256", MERCHANT_KEY)
        .update(JSON.stringify(paytmBody))
        .digest("hex");

      const paytmParams = {
        body: paytmBody,
        head: { signature: checksum },
      };

      // ✔ Correct URL (the REAL reason your txnToken was missing)
      const url = `https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=${MID}&orderId=${ORDERID}`;

      const { data } = await axios.post(url, paytmParams, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("---- Paytm initiate response ----");
      console.log(JSON.stringify(data, null, 2));

      const txnToken = data?.body?.txnToken;
      if (!txnToken) {
        return { ok: false, message: "Paytm did not return txnToken" };
      }

      return {
        ok: true,
        data: {
          paymentMethod: "paytm_js",
          mid: MID,
          orderId: ORDERID,
          txnToken,
          amount,
          currency,
          transactionId,
        },
      };
    } catch (err) {
      console.error("Paytm INIT ERROR:", err.response?.data || err.message);
      return { ok: false, message: "Paytm initiate failed" };
    }
  },

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================
  verifyPayment: async (input) => {
    try {
      const { callbackPayload } = input;

      const MID = process.env.PAYTM_MID;
      const MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;

      const ORDERID =
        callbackPayload?.ORDERID ||
        callbackPayload?.orderId ||
        callbackPayload?.order_id;

      if (!ORDERID) {
        return { ok: false, message: "ORDERID not found in callback" };
      }

      const body = { mid: MID, orderId: ORDERID };

      const signature = crypto
        .createHmac("sha256", MERCHANT_KEY)
        .update(JSON.stringify(body))
        .digest("hex");

      const payload = {
        body,
        head: { signature },
      };

      const statusURL = "https://securegw-stage.paytm.in/v3/order/status";

      const { data } = await axios.post(statusURL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("---- Paytm status response ----");
      console.log(JSON.stringify(data, null, 2));

      const result = data?.body;
      const status = result?.resultInfo?.resultStatus;

      let normalized = "processing";
      if (status === "TXN_SUCCESS") normalized = "paid";
      if (status === "TXN_FAILURE") normalized = "failed";

      return {
        ok: true,
        data: {
          status: normalized,
          gatewayOrderId: ORDERID,
          gatewayPaymentId: result?.txnId || "",
          amount: result?.txnAmount,
        },
      };
    } catch (err) {
      console.error("Paytm VERIFY ERROR:", err.response?.data || err.message);
      return { ok: false, message: "Paytm verify failed" };
    }
  },
};
