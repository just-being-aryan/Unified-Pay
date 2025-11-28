import axios from "axios";

export default {

  initiatePayment: async (input) => {
    try {
      const APP_ID = process.env.CASHFREE_APP_ID;
      const SECRET = process.env.CASHFREE_SECRET_KEY;
      const BASE_URL = (process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg")
        .replace(/\/$/, "");

      const { amount, transactionId, redirect = {}, customer = {}, meta = {}, currency = "INR" } = input;

      if (!APP_ID || !SECRET) {
        return { ok: false, message: "Missing Cashfree credentials" };
      }

      const txnAmount = Number(amount).toFixed(2);

      const payload = {
        link_amount: txnAmount,
        link_currency: currency,
        link_note: meta?.description || "Payment",
        link_purpose: meta?.linkPurpose || "ORDER_PAYMENT",
        link_title: meta?.linkTitle || "Payment",
        customer_details: {
          customer_name: customer?.name || "",
          customer_email: customer?.email || "",
          customer_phone: customer?.phone || "",
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
        timeout: 10000,
      });

      const linkUrl = resp.data?.link_url;

      if (!linkUrl) {
        return { ok: false, message: "Cashfree did not return link_url" };
      }

      // store transactionId, NOT link_id
      return {
        ok: true,
        message: "Cashfree initiate success",
        data: {
          paymentMethod: "redirect_url",
          redirectUrl: linkUrl,
          gatewayOrderId: transactionId,   // DB stores this
          raw: resp.data,
        },
      };

    } catch (err) {
      return {
        ok: false,
        message: "Cashfree initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  verifyPayment: async (input) => {
    try {
      const { callbackPayload } = input;

      const orderId =
        callbackPayload?.data?.order?.order_id ||
        null;

      const paymentId =
        callbackPayload?.data?.payment?.cf_payment_id ||
        null;

      const statusRaw =
        callbackPayload?.data?.payment?.payment_status ||
        "";

      const normalized =
        {
          SUCCESS: "paid",
          PAID: "paid",
          COMPLETED: "paid",
          SETTLED: "paid",
          PENDING: "processing",
          FAILED: "failed",
        }[statusRaw.toUpperCase()] || "processing";

      if (!orderId) {
        return { ok: false, message: "Missing order_id" };
      }

      return {
        ok: true,
        message: "Cashfree verified",
        data: {
          status: normalized,
          transactionId: orderId,
          gatewayPaymentId: paymentId,
          gatewayOrderId: orderId,
        },
      };

    } catch (err) {
      return { ok: false, message: "Cashfree verify error", raw: err };
    }
  },

  refundPayment: async (input) => {
    try {
      const { gatewayOrderId, amount, reason, config = {} } = input;
      const { appId, secretKey, baseUrl } = config;

      if (!gatewayOrderId) return { ok: false, message: "gatewayOrderId required" };

      const refundPayload = {
        refund_amount: Number(amount),
        refund_note: reason || "Refund",
      };

      const response = await axios.post(`${baseUrl}/links/${gatewayOrderId}/refunds`, refundPayload, {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2023-08-01",
        },
      });

      const data = response.data;

      return {
        ok: true,
        message: "Cashfree refund processed",
        data: {
          status: data.refund_status === "SUCCESS" ? "refunded" : "processing",
          refundId: data.cf_refund_id,
          amount: data.refund_amount,
        },
        raw: data,
      };
    } catch (err) {
      return { ok: false, message: "Cashfree refund error", raw: err };
    }
  },
};
