import axios from "axios";

const CF_BASE = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";

export default {
   initiatePayment: async (input) => {
    try {
      const { amount, currency, transactionId, customer, redirect, meta, config } = input;

      const url = `${config.baseUrl}/links`;

      const payload = {
        link_id: transactionId,
        link_amount: Number(amount),
        link_currency: currency,
        link_purpose: meta.description || "Payment",
        link_expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customer_details: {
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
        },
        link_meta: {
          return_url: `${process.env.FRONTEND_URL}/payments/success?order_id=${transactionId}`,
          notify_url: `${process.env.BACKEND_URL}/api/payments/verify/cashfree`,
        },
        link_notes: {
          description: meta?.description || "",
        }
      };

      const headers = {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": config.appId,
        "x-client-secret": config.secretKey,
      };

      const response = await axios.post(url, payload, { headers });

      console.log("🔥 Cashfree Payment Link Response:", response.data);

      return {
        ok: true,
        message: "Cashfree initiatePayment success",
        data: {
          method: "GET",
          redirectUrl: response.data.link_url, // 🔥 final checkout url
        },
      };
    } catch (error) {
      console.error("❌ Cashfree Error:", error.response?.data || error.message);
      return {
        ok: false,
        message: "Cashfree initiatePayment failed",
        raw: error.response?.data || error.message,
      };
    }
  },

  verifyPayment: async (input) => {
    try {
      const { callbackPayload, config } = input;
      const { appId, secretKey } = config;

      const orderId = callbackPayload.order_id;

      if (!orderId) {
        return { ok: false, message: "Missing order_id for verification" };
      }

      const headers = {
        "x-client-id": appId,
        "x-client-secret": secretKey,
      };

      const res = await axios.get(`${CF_BASE}/orders/${orderId}`, { headers });
      const data = res.data;

      let status = "processing";
      if (data.order_status === "PAID") status = "paid";
      else if (data.order_status === "FAILED") status = "failed";

      return {
        ok: true,
        message: "Cashfree verification success",
        data: {
          status,
          gatewayOrderId: data.order_id,
          gatewayPaymentId: data.cf_payment_id || "",
          amount: data.order_amount,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: "Cashfree verification error",
        raw: err.response?.data || err.message,
      };
    }
  },

  refundPayment: async (input) => {
    return { ok: false, message: "Cashfree refund not implemented yet" };
  },
};
