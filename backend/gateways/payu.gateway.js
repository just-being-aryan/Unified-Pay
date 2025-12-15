import crypto from "crypto";

const DEFAULT_PAYU_TEST_URL = "https://test.payu.in/_payment";

export const requiredFields = ["merchantKey", "merchantSalt", "mode"];

const PAYU_ENV = {
  key: process.env.PAYU_MERCHANT_KEY,
  salt: process.env.PAYU_MERCHANT_SALT,
  baseUrl: process.env.PAYU_BASE_URL,
};

export default {
  // =========================================================
  // INITIATE PAYMENT
  // =========================================================
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

      const cfg =
        configParam && Object.keys(configParam).length
          ? configParam
          : PAYU_ENV;

      const { key, salt, baseUrl = DEFAULT_PAYU_TEST_URL } = cfg || {};

      if (!key || !salt) {
        return {
          ok: false,
          message: "Invalid PayU configuration",
        };
      }

      if (!amount || !transactionId || !customer?.email) {
        return {
          ok: false,
          message: "Missing required fields for PayU initiate",
        };
      }

      const formattedAmount = Number(amount).toFixed(2);

      const surl = redirect.notifyUrl || redirect.successUrl || "";
      const furl = redirect.notifyUrl || redirect.failureUrl || "";

      const params = {
        key,
        txnid: transactionId,
        amount: formattedAmount,
        productinfo:
          meta?.productInfo || meta?.description || "Product Purchase",
        firstname: customer?.name || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
        surl,
        furl,
      };

      
      const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${salt}`;
      const hash = crypto
        .createHash("sha512")
        .update(hashString)
        .digest("hex");

      return {
        ok: true,
        message: "PayU initiate success",
        data: {
          paymentMethod: "redirect_form",
          redirectUrl: baseUrl,
          gatewayOrderId: transactionId, // IMPORTANT
          formData: {
            ...params,
            hash,
          },
        },
      };
    } catch (err) {
      console.error("PAYU INITIATE ERROR:", err?.message || err);
      return {
        ok: false,
        message: "PayU initiate error",
        raw: err?.message || err,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    try {
      const txnid = callbackPayload?.txnid;
      if (!txnid) {
        return { ok: false, message: "Missing txnid in PayU callback" };
      }

      const rawStatus = (
        callbackPayload?.status ||
        callbackPayload?.unmappedstatus ||
        ""
      )
        .toString()
        .toLowerCase();

      const statusMap = {
        success: "paid",
        captured: "paid",
        failure: "failed",
        failed: "failed",
        pending: "processing",
      };

      const status =
        statusMap[rawStatus] ||
        (rawStatus.includes("success") ? "paid" : "processing");

      const gatewayPaymentId =
        callbackPayload?.mihpayid ||
        callbackPayload?.bank_ref_num ||
        null;

      return {
        ok: true,
        message: "PayU verified",
        data: {
          status,
          gatewayPaymentId,
          amount: callbackPayload?.amount
            ? Number(callbackPayload.amount)
            : null,
        },
        raw: callbackPayload,
      };
    } catch (err) {
      console.error("PAYU VERIFY ERROR:", err?.message || err);
      return {
        ok: false,
        message: "PayU verify error",
        raw: err?.message || err,
      };
    }
  },

 
  extractReference: (payload) => {
    return payload?.txnid || null;
  },

  // =========================================================
  // REFUND (STUB)
  // =========================================================
  refundPayment: async () => {
    return {
      ok: false,
      message: "PayU refund not implemented",
    };
  },
};
