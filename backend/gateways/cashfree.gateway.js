import axios from "axios";

export const requiredFields = [
  "CASHFREE_APP_ID",
  "CASHFREE_SECRET_KEY",
  "CASHFREE_BASE_URL",
];

export default {

  initiatePayment: async (input) => {
    try {
      const {
        amount,
        transactionId,
        redirect = {},
        customer = {},
        meta = {},
        currency = "INR",
        config = {},
      } = input;

      const APP_ID =
        config.CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
      const SECRET =
        config.CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
      const BASE_URL = (
        config.CASHFREE_BASE_URL ||
        process.env.CASHFREE_BASE_URL ||
        "https://sandbox.cashfree.com/pg"
      ).replace(/\/$/, "");

      if (!APP_ID || !SECRET) {
        return { ok: false, message: "Missing Cashfree credentials" };
      }

      const txnAmount = Number(amount).toFixed(2);

      let safePhone = customer?.phone;
      if (!safePhone || !/^[0-9]{8,15}$/.test(safePhone)) {
        safePhone = "9999999999";
      }

      const payload = {
        link_amount: txnAmount,
        link_currency: currency,
        link_note: meta?.description || "Payment",
        link_purpose: meta?.linkPurpose || "ORDER_PAYMENT",
        link_title: meta?.linkTitle || "Payment",

        customer_details: {
          customer_name: customer?.name || "",
          customer_email: customer?.email || "",
          customer_phone: safePhone,
        },

        notify_url: redirect.notifyUrl,
        return_url: redirect.successUrl,
        cancel_url: redirect.failureUrl,
      };

      const resp = await axios.post(`${BASE_URL}/links`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": APP_ID,
          "x-client-secret": SECRET,
          "x-api-version": "2023-08-01",
        },
      });

      const linkUrl = resp.data?.link_url;
      const linkId =
        resp.data?.link_id || resp.data?.cf_link_id || null;

      if (!linkUrl || !linkId) {
        return {
          ok: false,
          message: "Cashfree did not return link_id",
          raw: resp.data,
        };
      }

      return {
        ok: true,
        message: "Cashfree initiate success",
        data: {
          paymentMethod: "redirect_url",
          redirectUrl: linkUrl,
          gatewayOrderId: linkId, 
          raw: resp.data,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: "Cashfree initiate error",
        raw: err?.response?.data || err.message,
      };
    }
  },

 
  verifyPayment: async ({ callbackPayload }) => {
    try {
      const linkId =
        callbackPayload?.data?.order?.order_id ||
        callbackPayload?.link_id ||
        callbackPayload?.cf_link_id ||
        null;

      if (!linkId) {
        return { ok: false, message: "Missing Cashfree link_id" };
      }

      const payment = callbackPayload?.data?.payment || {};

      const statusRaw = (payment.payment_status || "").toUpperCase();

      const statusMap = {
        SUCCESS: "paid",
        PAID: "paid",
        COMPLETED: "paid",
        SETTLED: "paid",
        FAILED: "failed",
        CANCELLED: "cancelled",
        PENDING: "processing",
      };

      const status = statusMap[statusRaw] || "processing";

      return {
        ok: true,
        message: "Cashfree verified",
        data: {
          status,
          gatewayPaymentId: payment?.cf_payment_id || null,
          amount: payment?.payment_amount
            ? Number(payment.payment_amount)
            : null,
        },
        raw: callbackPayload,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Cashfree verify error",
        raw: err?.message || err,
      };
    }
  },

 
  extractReference: (payload) => {
    return (
      payload?.link_id ||
      payload?.cf_link_id ||
      payload?.data?.order?.order_id ||
      null
    );
  },


  refundPayment: async () => {
    return {
      ok: false,
      message: "Cashfree refund not implemented",
    };
  },
};
