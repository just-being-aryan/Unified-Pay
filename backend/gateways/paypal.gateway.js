import axios from "axios";

export const requiredFields = ["clientId", "secret", "baseUrl"];

function resolvePayPalConfig(config = {}) {
  const CLIENT_ID = config.clientId || process.env.PAYPAL_CLIENT_ID;
  const SECRET = config.secret || process.env.PAYPAL_SECRET;
  const BASE_URL =
    config.baseUrl ||
    process.env.PAYPAL_BASE_URL ||
    "https://api-m.sandbox.paypal.com";

  if (!CLIENT_ID || !SECRET) {
    throw new Error("PayPal credentials missing");
  }

  return { CLIENT_ID, SECRET, BASE_URL };
}

async function getPayPalAccessToken(cfg) {
  const { CLIENT_ID, SECRET, BASE_URL } = cfg;

  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");

  const res = await axios.post(
    `${BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!res.data?.access_token) {
    throw new Error("Failed to obtain PayPal access token");
  }

  return res.data.access_token;
}

export default {
 
  initiatePayment: async (input) => {
    try {
      const {
        amount,
        transactionId,
        customer = {},
        redirect = {},
        meta = {},
        config = {},
      } = input;

      if (!amount || !transactionId) {
        throw new Error("Missing amount or transactionId");
      }

      const cfg = resolvePayPalConfig(config);
      const accessToken = await getPayPalAccessToken(cfg);

      const body = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: transactionId, 
            description: meta.description || "Order payment",
            amount: {
              currency_code: "USD",
              value: Number(amount).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "UnifiedPay",
          user_action: "PAY_NOW",
          return_url: redirect.notifyUrl,   
          cancel_url: redirect.failureUrl,
        },
      };

      const orderRes = await axios.post(
        `${cfg.BASE_URL}/v2/checkout/orders`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const order = orderRes.data;
      const approvalLink =
        order.links?.find((l) => l.rel === "approve")?.href || null;

      if (!order?.id || !approvalLink) {
        throw new Error("Invalid PayPal order response");
      }

      return {
        ok: true,
        message: "PayPal order created",
        data: {
          paymentMethod: "redirect_url",
          redirectUrl: approvalLink,
          gatewayOrderId: order.id, 
          raw: order,
        },
      };
    } catch (err) {
      console.error(
        "PAYPAL INIT ERROR:",
        err.response?.data || err.message
      );
      return {
        ok: false,
        message: "PayPal initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT (CAPTURE ORDER)
  // =========================================================
  verifyPayment: async ({ callbackPayload, config }) => {
    try {
      const orderId = callbackPayload?.token || null;
      if (!orderId) {
        return {
          ok: false,
          message: "Missing PayPal order id (token)",
        };
      }

      const cfg = resolvePayPalConfig(config);
      const accessToken = await getPayPalAccessToken(cfg);

      const captureRes = await axios.post(
        `${cfg.BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const capture = captureRes.data;
      const completed = capture.status === "COMPLETED";

      const payment =
        capture.purchase_units?.[0]?.payments?.captures?.[0] || null;

      return {
        ok: true,
        message: "PayPal verify success",
        data: {
          status: completed ? "paid" : "failed",
          gatewayPaymentId: payment?.id || null,
          amount: payment?.amount?.value
            ? Number(payment.amount.value)
            : null,
        },
        raw: capture,
      };
    } catch (err) {
      console.error(
        "PAYPAL VERIFY ERROR:",
        err.response?.data || err.message
      );
      return {
        ok: false,
        message: "PayPal verify error",
        raw: err.response?.data || err.message,
      };
    }
  },

 
  extractReference: (payload) => {
    // PayPal redirect: ?token=ORDER_ID&PayerID=...
    return payload?.token || null;
  },

  
  refundPayment: async () => {
    return {
      ok: false,
      message: "PayPal refund not implemented",
    };
  },
};
