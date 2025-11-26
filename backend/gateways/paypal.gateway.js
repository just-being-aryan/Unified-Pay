// backend/gateways/paypal.gateway.js
import axios from "axios";

function getPayPalConfig() {
  const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const SECRET = process.env.PAYPAL_SECRET;
  const BASE_URL =
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

  if (!CLIENT_ID || !SECRET) {
    throw new Error(
      `PayPal credentials missing. CLIENT_ID: ${CLIENT_ID ? "OK" : "MISSING"}, SECRET: ${SECRET ? "OK" : "MISSING"}`
    );
  }

  return { CLIENT_ID, SECRET, BASE_URL };
}

async function getPayPalAccessToken() {
  const { CLIENT_ID, SECRET, BASE_URL } = getPayPalConfig();

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
  // =========================================================
  // INITIATE PAYMENT (PayPal Checkout v2)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const { BASE_URL } = getPayPalConfig();
      const accessToken = await getPayPalAccessToken();

      const {
      amount,
      transactionId,
      customer = {},
      redirect = {},
      meta = {},
    } = input;

// Force currency to USD because PayPal does not support INR
const currency = "USD";

      if (!amount || !transactionId) {
        throw new Error("Missing amount or transactionId for PayPal initiate");
      }

      const returnUrl =
        redirect.notifyUrl ||
        `${process.env.BACKEND_URL}/api/payments/callback/paypal`;
      const cancelUrl =
        redirect.failureUrl ||
        `${process.env.FRONTEND_BASE || "http://localhost:5173"}/payments/failure`;

      const body = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: String(transactionId),
            description:
              meta.description || meta.linkTitle || "Order payment",
            amount: {
              currency_code: currency,
              value: Number(amount).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "UnifiedPay",
          user_action: "PAY_NOW",
          return_url: returnUrl, // backend callback -> verifyPayment -> redirect to FE
          cancel_url: cancelUrl,
        },
      };

      const orderRes = await axios.post(
        `${BASE_URL}/v2/checkout/orders`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const order = orderRes.data;

      if (!order?.id) {
        throw new Error("Invalid PayPal order response (missing id)");
      }

      const approvalLink =
        order.links?.find((l) => l.rel === "approve")?.href || null;

      if (!approvalLink) {
        throw new Error("Missing approval URL in PayPal response");
      }

      // This is what paymentInitiateState expects (result.data.*)
      // and what Payments.jsx redirects on.
      return {
        ok: true,
        message: "PayPal order created",
        data: {
          paymentMethod: "redirect_url",      // frontend checks this
          redirectUrl: approvalLink,          // frontend redirects here
          gatewayOrderId: order.id,           // stored by paymentInitiateState
          providerRaw: order,
        },
      };
    } catch (err) {
      console.error("PAYPAL INITIATE ERROR:", err.response?.data || err.message || err);
      return {
        ok: false,
        message: "PayPal initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT (PayPal capture)
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    try {
      const { BASE_URL } = getPayPalConfig();
      const accessToken = await getPayPalAccessToken();

      // paymentVerifyState already extracts token into extractedTxnId and finds Transaction.
      // Here we just need the order id from callback.
      const orderId =
        callbackPayload?.token || // typical PayPal return ?token=ORDER_ID
        callbackPayload?.orderId ||
        callbackPayload?.order_id ||
        null;

      if (!orderId) {
        throw new Error("Missing PayPal order id (token) in callback");
      }

      // Capture the order
      const captureRes = await axios.post(
        `${BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const capture = captureRes.data;

      const status = capture.status === "COMPLETED" ? "paid" : "failed";

      // Extract payment id + amount
      let gatewayPaymentId = null;
      let amount = null;

      try {
        const unit = capture.purchase_units?.[0];
        const payment = unit?.payments?.captures?.[0];
        gatewayPaymentId = payment?.id || null;
        if (payment?.amount?.value) {
          amount = parseFloat(payment.amount.value);
        }
      } catch (e) {
        // ignore parsing issues, we'll just skip amount override
      }

      return {
        ok: true,
        message: "PayPal verify success",
        data: {
          status,
          gatewayOrderId: orderId,
          gatewayPaymentId,
          amount,
        },
        raw: capture,
      };
    } catch (err) {
      console.error("PAYPAL VERIFY ERROR:", err.response?.data || err.message || err);
      return {
        ok: false,
        message: "PayPal verify error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // REFUND (stub for now)
  // =========================================================
  refundPayment: async () => {
    // You haven't wired refunds yet. Keep this simple stub
    return {
      ok: false,
      message: "PayPal refund not implemented yet",
    };
  },
};
