// backend/gateways/razorpay.gateway.js
import axios from "axios";
import crypto from "crypto";

export const requiredFields = ["keyId", "keySecret", "mode"];

export default {
  // =========================================================
  // INITIATE PAYMENT — Razorpay JS Checkout
  // =========================================================
  initiatePayment: async (input) => {
    console.log("\n[Razorpay] Initiate Payment");

    try {
      const KEY_ID = process.env.RAZORPAY_TEST_API_KEY;
      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;

      console.log("[Razorpay] KEY_ID:", KEY_ID);
      console.log("[Razorpay] KEY_SECRET loaded?:", KEY_SECRET ? "YES" : "NO");

      if (!KEY_ID || !KEY_SECRET) {
        return { ok: false, message: "Missing Razorpay API keys" };
      }

      const {
        amount,
        currency = "INR",
        transactionId,
        customer = {},
        redirect = {},
        meta = {},
      } = input;

      if (!amount || !transactionId) {
        return { ok: false, message: "Missing amount or transactionId" };
      }

      console.log("[Razorpay] Amount:", amount);
      console.log("[Razorpay] TransactionId:", transactionId);
      console.log("[Razorpay] Customer:", customer);
      console.log("[Razorpay] Redirect:", redirect);

      const orderPayload = {
        amount: Math.round(Number(amount) * 100), // convert to paise
        currency,
        receipt: transactionId,
        notes: {
          transactionId,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          description: meta?.description || "Payment",
        },
      };

      console.log("[Razorpay] Creating Order Payload:", orderPayload);

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

      console.log("[Razorpay] Order Created:", order);

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
          transactionId, // IMPORTANT: Return this so frontend can send it back
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
        },
      };
    } catch (err) {
      console.log("[Razorpay] Initiate Error:", err.response?.data || err.message);

      return {
        ok: false,
        message: "Razorpay initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT SIGNATURE
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    console.log("\n[Razorpay] Verify Payment");
    console.log("[Razorpay] Callback Payload:", callbackPayload);

    try {
      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;
      console.log("[Razorpay] KEY_SECRET loaded?:", KEY_SECRET ? "YES" : "NO");

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        txnid, // Custom transaction ID from frontend
      } = callbackPayload;

      console.log("[Razorpay] razorpay_order_id:", razorpay_order_id);
      console.log("[Razorpay] razorpay_payment_id:", razorpay_payment_id);
      console.log("[Razorpay] razorpay_signature:", razorpay_signature);
      console.log("[Razorpay] txnid (custom):", txnid);

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return { ok: false, message: "Missing Razorpay verification fields" };
      }

      // Verify signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(body)
        .digest("hex");

      console.log("[Razorpay] Expected Signature:", expectedSignature);
      console.log("[Razorpay] Received Signature:", razorpay_signature);

      const isValid = expectedSignature === razorpay_signature;
      console.log("[Razorpay] Signature match:", isValid);

      if (!isValid) {
        return {
          ok: true,
          message: "Invalid Razorpay signature",
          data: {
            status: "failed",
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            transactionId: txnid, // MUST be your custom txnid
          },
        };
      }

      // Signature is valid - payment successful
      // CRITICAL: Return txnid as transactionId so paymentVerifyState can find the DB record
      return {
        ok: true,
        message: "Razorpay verify success",
        data: {
          status: "paid",
          gatewayOrderId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id,
          transactionId: txnid, // MUST be your custom txnid, not razorpay_order_id
        },
      };
    } catch (err) {
      console.log("[Razorpay] Verify Error:", err.response?.data || err.message);

      return {
        ok: false,
        message: "Razorpay verify error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // REFUND PAYMENT
  // =========================================================
  refundPayment: async ({ gatewayPaymentId, amount, reason }) => {
    console.log("\n[Razorpay] Refund Request");
    console.log("[Razorpay] gatewayPaymentId:", gatewayPaymentId);
    console.log("[Razorpay] amount:", amount);
    console.log("[Razorpay] reason:", reason);

    try {
      const KEY_ID = process.env.RAZORPAY_TEST_API_KEY;
      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;

      if (!KEY_ID || !KEY_SECRET) {
        return { ok: false, message: "Missing Razorpay credentials" };
      }

      const refundPayload = {
        amount: Math.round(Number(amount) * 100), // paise
        notes: { reason: reason || "Refund" },
      };

      console.log("[Razorpay] Refund Payload:", refundPayload);

      const refundRes = await axios.post(
        `https://api.razorpay.com/v1/payments/${gatewayPaymentId}/refund`,
        refundPayload,
        {
          auth: {
            username: KEY_ID,
            password: KEY_SECRET,
          },
        }
      );

      const data = refundRes.data;
      console.log("[Razorpay] Refund Response:", data);

      return {
        ok: true,
        message: "Razorpay refund success",
        data: {
          refundId: data.id,
          status: data.status === "processed" ? "refunded" : "processing",
          amount: data.amount,
        },
      };
    } catch (err) {
      console.log("[Razorpay] Refund Error:", err.response?.data || err.message);

      return {
        ok: false,
        message: "Razorpay refund error",
        raw: err.response?.data || err.message,
      };
    }
  },
};