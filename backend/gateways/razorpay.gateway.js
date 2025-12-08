import axios from "axios";
import crypto from "crypto";
import Transaction from "../models/transaction.model.js";

export default {
  // =========================================================
  // INITIATE PAYMENT — Razorpay Standard Checkout (popup)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const KEY_ID = process.env.RAZORPAY_TEST_API_KEY;
      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;

      console.log("\n=========== RAZORPAY INITIATE ===========");
      console.log("Razorpay Key ID present:", !!KEY_ID);
      console.log("Razorpay Secret present:", !!KEY_SECRET);

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

      console.log("Input received:", input);

      if (!amount || !transactionId) {
        return { ok: false, message: "Missing amount or transactionId" };
      }

      const orderPayload = {
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: transactionId,
        notes: {
          transactionId,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          description: meta.description || "Payment",
        },
      };

      console.log("Creating Razorpay order with payload:", orderPayload);

      const orderRes = await axios.post(
        "https://api.razorpay.com/v1/orders",
        orderPayload,
        { auth: { username: KEY_ID, password: KEY_SECRET } }
      );

      const order = orderRes.data;

      console.log("✨ Razorpay Order Created Successfully ✨");
      console.log("Order ID:", order.id);

      return {
        ok: true,
        message: "Razorpay initiate success",
        data: {
          paymentMethod: "razorpay_js",
          key: KEY_ID,
          orderId: order.id,
          amount: order.amount,
          currency,
          transactionId,
          callbackUrl: redirect.notifyUrl,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
        },
      };
    } catch (err) {
      console.log("\n❌❌ RAZORPAY INITIATE ERROR ❌❌");
      console.log("Error message:", err.message);
      console.log("Error response:", err.response?.data);

      return {
        ok: false,
        message: "Razorpay initiate error",
        raw: err.response?.data || err.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT — FIXED TO SUPPORT paymentVerifyState.js
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    try {

      callbackPayload.order_id = callbackPayload.razorpay_order_id;

      console.log("\n=========== RAZORPAY VERIFY ===========");
      console.log("Callback Payload:", JSON.stringify(callbackPayload, null, 2));

      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = callbackPayload;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return { ok: false, message: "Missing Razorpay verification fields" };
      }

      // 🔥 CRITICAL FIX 🔥
      // Attach gatewayOrderId so paymentVerifyState.js can extract it
      callbackPayload.gatewayOrderId = razorpay_order_id;

      // Verify signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(body)
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;

      if (!isValid) {
        return {
          ok: true,
          message: "Invalid Razorpay signature",
          data: {
            status: "failed",
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            transactionId: razorpay_order_id,
          },
        };
      }

      // Verified success
      return {
        ok: true,
        message: "Razorpay verify success",
        data: {
          status: "paid",
          gatewayOrderId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id,
          transactionId: razorpay_order_id,
        },
      };
    } catch (err) {
      console.log("\n❌❌ RAZORPAY VERIFY ERROR ❌❌");
      console.log("Error message:", err.message);

      return {
        ok: false,
        message: "Razorpay verify error",
        raw: err.response?.data || err.message,
      };
    }
  },
};
