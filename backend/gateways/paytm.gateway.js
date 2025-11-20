import PaytmChecksumLib from "paytmchecksum";
import axios from "axios";

function getPaytmConfig() {
  const cleanKey = (process.env.PAYTM_MERCHANT_KEY || "")
    .replace(/^["']|["']$/g, "");

  return {
    MID: process.env.PAYTM_MERCHANT_ID,
    MKEY: cleanKey,
    WEBSITE: process.env.PAYTM_MERCHANT_WEBSITE || "WEBSTAGING",
    INDUSTRY: process.env.PAYTM_MERCHANT_INDUSTRY || "Retail",
    CHANNEL: process.env.PAYTM_CHANNEL_ID || "WEB",
    INIT_URL: "https://securegw-stage.paytm.in/theia/processTransaction",
    STATUS_URL: "https://securegw-stage.paytm.in/merchant-status/getTxnStatus",
    REFUND_URL: "https://securegw-stage.paytm.in/refund/apply",
  };
}

function generatePaytmOrderId() {
  const timestamp = Date.now().toString();
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD${timestamp}${randomStr}`;
}

export default {
  // =========================================================
  // INITIATE PAYMENT (v1 hosted checkout)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const { MID, MKEY, WEBSITE, INDUSTRY, CHANNEL, INIT_URL } =
        getPaytmConfig();

      if (!MID || !MKEY) {
        throw new Error(
          `Paytm credentials not configured. MID: ${MID ? "OK" : "MISSING"}, MKEY: ${MKEY ? "OK" : "MISSING"}`
        );
      }

      const { amount, customer = {}, redirect = {} } = input;

      const paytmOrderId = generatePaytmOrderId();

      const callbackUrl =
        redirect.notifyUrl ||
        `${process.env.BACKEND_URL}/api/payments/callback/paytm`;

      // FINAL CORRECT PARAMS (use the keys Paytm expects during checkout)
      const paytmParams = {
        MID: String(MID),
        WEBSITE: String(WEBSITE),
        INDUSTRY_TYPE_ID: String(INDUSTRY),
        CHANNEL_ID: String(CHANNEL),
        ORDERID: String(paytmOrderId),       // use ORDERID (no underscore)
        CUST_ID: String(customer.email || "guest@example.com"),
        TXNAMOUNT: String(Number(amount).toFixed(2)), // use TXNAMOUNT (no underscore)
        CALLBACK_URL: String(callbackUrl),
      };


      console.log("=== PAYTM INITIATE DEBUG ===");
      console.log("All params:", paytmParams);
      console.log("CALLBACK_URL (sent to Paytm):", paytmParams.CALLBACK_URL);

      // generate checksum
      const CHECKSUMHASH = await PaytmChecksumLib.generateSignature(paytmParams, MKEY);
      // final formData
      const formData = { ...paytmParams, CHECKSUMHASH };
      console.log("Form data to post to Paytm:", formData);
      console.log("===========================");
      // Form data to POST to Paytm is `formData` above

      
      return {
        ok: true,
        message: "Paytm initiate success",
        data: {
          paymentMethod: "redirect_form",
          // POST to INIT_URL (no query params). The frontend posts formData (MID, ORDERID, CHECKSUMHASH) to this URL.
          redirectUrl: `${INIT_URL}?mid=${MID}&orderId=${paytmOrderId}`,
          gatewayOrderId: paytmOrderId,
          formData: formData,
        },
        // expose callback URL and formData to the frontend for debugging
        raw: { paytmOrderId, checksum: CHECKSUMHASH, callbackUrl: paytmParams.CALLBACK_URL, formData },
      };
    } catch (err) {
      console.error("==== PAYTM INITIATE ERROR ====");
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);
      console.error("==============================");
      return {
        ok: false,
        message: `Paytm initiate error: ${err.message}`,
        raw: err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT (v1 callback)
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    try {
      const { MID, MKEY, STATUS_URL } = getPaytmConfig();

      console.log("=== PAYTM CALLBACK RECEIVED ===");
      console.log("Payload:", JSON.stringify(callbackPayload, null, 2));

      const orderId =
        callbackPayload.ORDER_ID ||
        callbackPayload.ORDERID ||
        callbackPayload.ORDER_ID?.toString() ||
        callbackPayload.orderId;

      if (!orderId) {
        return { ok: false, message: "Missing ORDERID in callback" };
      }

      // Verify callback checksum (if present)
      const receivedChecksum = callbackPayload.CHECKSUMHASH;
      if (receivedChecksum) {
        const paramsForVerify = { ...callbackPayload };
        delete paramsForVerify.CHECKSUMHASH;

        const isValidChecksum = PaytmChecksumLib.verifySignature(
          paramsForVerify,
          MKEY,
          receivedChecksum
        );

        console.log("Checksum Valid:", isValidChecksum);

        if (!isValidChecksum) {
          return { ok: false, message: "Checksum verification failed" };
        }
      }

      // STATUS CHECK API (form-url-encoded)
      const statusParams = {
        MID: String(MID),
        ORDERID: String(orderId),
      };

      const checksum = await PaytmChecksumLib.generateSignature(
        statusParams,
        MKEY
      );

      // build form-urlencoded body
      const params = new URLSearchParams();
      Object.entries({ ...statusParams, CHECKSUMHASH: checksum }).forEach(
        ([k, v]) => params.append(k, String(v ?? ""))
      );

      const res = await axios.post(STATUS_URL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const result = res.data;
      console.log("Paytm Status Response:", JSON.stringify(result, null, 2));

      let status = "processing";
      if (result.STATUS === "TXN_SUCCESS") status = "paid";
      else if (result.STATUS === "TXN_FAILURE") status = "failed";

      return {
        ok: true,
        message: "Paytm verify success",
        data: {
          status,
          gatewayOrderId: orderId,
          gatewayPaymentId: result.TXNID || result.BANKTXNID,
          amount: result.TXNAMOUNT,
        },
        raw: result,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Paytm verify error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // REFUND (v1 refund API)
  // =========================================================
  refundPayment: async (input) => {
    try {
      const { MID, MKEY, REFUND_URL } = getPaytmConfig();
      const { gatewayPaymentId, gatewayOrderId, amount, reason } = input;

      const refundId = "RFND_" + Date.now();

      const payload = {
        MID: String(MID),
        TXNID: String(gatewayPaymentId),
        ORDERID: String(gatewayOrderId || gatewayPaymentId),
        REFUNDAMOUNT: String(amount || ""),
        TXNTYPE: "REFUND",
        REFID: String(refundId),
        COMMENTS: String(reason || "Refund processed"),
      };

      const checksum = await PaytmChecksumLib.generateSignature(
        payload,
        MKEY
      );

      const response = await axios.post(
        REFUND_URL,
        {
          ...payload,
          CHECKSUMHASH: checksum,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      return {
        ok: true,
        message: "Paytm refund processed",
        data: {
          status: data?.RESPCODE === "10" ? "refunded" : "processing",
          refundId,
          amount,
        },
        raw: data,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Paytm refund error",
        raw: err.response?.data || err.message,
      };
    }
  },
};
