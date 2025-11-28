import crypto from "crypto";
import axios from "axios";

const DEFAULT_PAYU_TEST_URL = "https://test.payu.in/_payment";

const PAYU_ENV = {
  key: process.env.PAYU_MERCHANT_KEY,
  salt: process.env.PAYU_MERCHANT_SALT,
  baseUrl: process.env.PAYU_BASE_URL,
};

export default {
  initiatePayment: async (input) => {
    try {
      const {
        amount,
        currency = "INR",
        transactionId,
        customer = {},
        meta = {},
        redirect = {},
        config: configParam,
      } = input;

      const cfg = configParam && Object.keys(configParam).length ? configParam : PAYU_ENV;
      const { key, salt, baseUrl = DEFAULT_PAYU_TEST_URL } = cfg || {};

      if (!key || !salt) {
        return {
          ok: false,
          message: "Invalid PayU configuration: missing key or salt",
        };
      }

      if (!amount || !transactionId || !customer?.email) {
        return { ok: false, message: "Missing required fields for PayU initiate" };
      }

      const formattedAmount = Number(amount).toFixed(2);
      // Prefer backend notify URL for PayU so PayU posts back to our server
      const surl = redirect.notifyUrl || redirect.successUrl || redirect.success || "";
      const furl = redirect.notifyUrl || redirect.failureUrl || redirect.failure || "";

      const params = {
        key,
        txnid: transactionId,
        amount: formattedAmount,
        productinfo: meta?.productInfo || meta?.description || "Product Purchase",
        firstname: customer?.name || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
        surl,
        furl,
      };

      console.log("PayU initiate params (no hash):", params);

      // PayU hash string: key|txnid|amount|productinfo|firstname|email|||||||||||SALT
      const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      console.log("PayU hash generated:", hash);

      return {
        ok: true,
        message: "PayU initiate success",
        data: {
          paymentMethod: "redirect_form",
          redirectUrl: baseUrl,
          formData: {
            ...params,
            hash,
            // ensure the backend webhook/notify URL is included so PayU can POST server-to-server
            notify_url: redirect?.notifyUrl || redirect?.successUrl || "",
          },
        },
      };
    } catch (err) {
      console.error("PAYU INITIATE ERROR:", err?.response?.data || err?.message || err);
      return {
        ok: false,
        message: "PayU initiate error",
        raw: err?.response?.data || err?.message,
      };
    }
  },

  verifyPayment: async (input) => {
    try {
      const { callbackPayload } = input;
      // PayU posts lots of fields; txnid is the transaction reference we used when creating the txn
      const txnid =
        callbackPayload?.txnid ||
        callbackPayload?.transactionId ||
        callbackPayload?.order_id;

      if (!txnid) {
        return { ok: false, message: "Missing txnid in PayU callback" };
      }

      // Determine PayU status - prefer unmappedstatus then status
      const rawStatus =
        (callbackPayload?.unmappedstatus || callbackPayload?.status || "")
          .toString()
          .toLowerCase();

      const normalized =
        {
          captured: "paid",
          success: "paid",
          pending: "processing",
          failure: "failed",
          failed: "failed",
          declined: "failed",
        }[rawStatus] || (rawStatus.includes("success") ? "paid" : "processing");

      const gatewayPaymentId =
        callbackPayload?.mihpayid || callbackPayload?.bank_ref_num || null;

      return {
        ok: true,
        message: "PayU verified",
        data: {
          status: normalized,
          gatewayPaymentId,
          gatewayOrderId: txnid,
          amount: callbackPayload?.amount,
        },
      };
    } catch (err) {
      console.error("PAYU VERIFY ERROR:", err?.message || err);
      return { ok: false, message: "PayU verify error", raw: err?.message || err };
    }
  },

  refundPayment: async (input) => {
    try {
      return { ok: false, message: "PayU refund not implemented in this stub" };
    } catch (err) {
      return { ok: false, message: "PayU refund error", raw: err?.message || err };
    }
  },

  
};