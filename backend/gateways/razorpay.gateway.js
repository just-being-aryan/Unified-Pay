import axios from "axios";
import crypto from "crypto";

export const requiredFields = ["RAZORPAY_TEST_API_KEY", "RAZORPAY_TEST_API_SECRET"];

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
        redirect = {},
        meta = {},
        config = {},
      } = input;

      const KEY_ID =
        config.RAZORPAY_TEST_API_KEY || process.env.RAZORPAY_TEST_API_KEY;
      const KEY_SECRET =
        config.RAZORPAY_TEST_API_SECRET || process.env.RAZORPAY_TEST_API_SECRET;

      if (!KEY_ID || !KEY_SECRET) {
        return { ok: false, message: "Missing Razorpay API keys" };
      }

      if (!amount || !transactionId) {
        return { ok: false, message: "Missing amount or transactionId" };
      }

      const orderPayload = {
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: transactionId,
        notes: {
          transactionId,
          description: meta.description || "Payment",
        },
      };

      const orderRes = await axios.post(
        "https://api.razorpay.com/v1/orders",
        orderPayload,
        {
          auth: {
            username: KEY_ID,
            password: KEY_SECRET,
          },
        }
      );

      const order = orderRes.data;

      if (!order?.id) {
        return { ok: false, message: "Invalid Razorpay order response" };
      }

      return {
        ok: true,
        message: "Razorpay initiate success",
        data: {
          paymentMethod: "razorpay_js",
          key: KEY_ID,
          orderId: order.id,
          amount: order.amount,
          currency,
          callbackUrl: redirect.notifyUrl,
          prefill: {
            name: customer.name || "",
            email: customer.email || "",
            contact: customer.phone || "",
          },
          gatewayOrderId: order.id,
          raw: order,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: "Razorpay initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================
  verifyPayment: async ({ callbackPayload, config }) => {
    try {
      const KEY_SECRET =
        config?.RAZORPAY_TEST_API_SECRET ||
        process.env.RAZORPAY_TEST_API_SECRET;

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = callbackPayload;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return {
          ok: false,
          message: "Missing Razorpay verification fields",
        };
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(body)
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;

      return {
        ok: true,
        message: "Razorpay verification completed",
        data: {
          status: isValid ? "paid" : "failed",
          gatewayPaymentId: razorpay_payment_id,
        },
        raw: callbackPayload,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Razorpay verify error",
        raw: err.message,
      };
    }
  },

  // =========================================================
  // EXTRACT REFERENCE
  // =========================================================
  extractReference: (payload) => {
    return payload?.razorpay_order_id || null;
  },

  refundPayment: async () => {
    return {
      ok: false,
      message: "Razorpay refund not implemented",
    };
  },
};
