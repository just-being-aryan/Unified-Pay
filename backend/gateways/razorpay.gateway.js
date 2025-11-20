import axios from "axios";
import crypto from "crypto";

export default {
  // =========================================================
  // INITIATE PAYMENT (Razorpay Embedded Full-Page Checkout)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const KEY_ID = process.env.RAZORPAY_TEST_API_KEY;
      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;

      if (!KEY_ID || !KEY_SECRET) {
        return { ok: false, message: "Missing Razorpay API keys" };
      }

      const {
        amount,
        currency = "INR",
        transactionId,
        customer = {},
        redirect = {},
        meta = {}
      } = input;

      if (!amount || !transactionId) {
        return { ok: false, message: "Missing amount or transactionId" };
      }

      const orderAmountPaise = Math.round(Number(amount) * 100);

      // -----------------------
      // 1. Create Razorpay Order
      // -----------------------
      const orderPayload = {
        amount: orderAmountPaise,
        currency,
        receipt: transactionId,               // 🔥 stored as receipt
        notes: {
          transactionId,                      // 🔥 CRITICAL to fetching it back later
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          description: meta.description || "Payment"
        }
      };

      console.log("Razorpay order payload:", orderPayload);

      const orderRes = await axios.post(
        "https://api.razorpay.com/v1/orders",
        orderPayload,
        {
          auth: { username: KEY_ID, password: KEY_SECRET }
        }
      );

      const order = orderRes.data;
      console.log("Razorpay order response:", order);

      // -----------------------
      // 2. Prepare embedded checkout redirect_form
      // -----------------------
      const redirectUrl = "https://api.razorpay.com/v1/checkout/embedded";

      const formData = {
        key_id: KEY_ID,
        amount: orderAmountPaise,
        currency,
        order_id: order.id,
        name: "UnifiedPay",
        description: meta.description || "Payment",
        "prefill[name]": customer.name || "",
        "prefill[email]": customer.email || "",
        "prefill[contact]": customer.phone || "",
        callback_url: redirect.notifyUrl,
        redirect: true
      };

      return {
        ok: true,
        message: "Razorpay initiate success",
        data: {
          paymentMethod: "redirect_form",
          redirectUrl,
          formData,
          gatewayOrderId: order.id
        }
      };

    } catch (err) {
      console.error("RAZORPAY INITIATE ERROR:", err.response?.data || err.message);
      return {
        ok: false,
        message: "Razorpay order creation failed",
        raw: err.response?.data || err.message
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT (Razorpay)
  // =========================================================
  verifyPayment: async ({ callbackPayload }) => {
    try {
      console.log("Razorpay verify payload:", callbackPayload);

      const KEY_SECRET = process.env.RAZORPAY_TEST_API_SECRET;
      
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = callbackPayload;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return { ok: false, message: "Missing Razorpay verification fields" };
      }

      // Step 1 — Signature verification
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", KEY_SECRET)
        .update(body)
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;

      if (!isValid) {
        return {
          ok: true,
          message: "Razorpay signature verification failed",
          data: {
            status: "failed",
            gatewayPaymentId: razorpay_payment_id,
            gatewayOrderId: razorpay_order_id,
            transactionId: null,
          }
        };
      }

      // Step 2 — Fetch order details
      let order;
      try {
        const orderRes = await axios.get(
          `https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
          {
            auth: {
              username: process.env.RAZORPAY_TEST_API_KEY,
              password: process.env.RAZORPAY_TEST_API_SECRET
            }
          }
        );
        order = orderRes.data;
        console.log("Razorpay order details:", order);
      } catch (err) {
        console.error("Error fetching Razorpay order details:", err);
      }

      // ---------------------------------------------------------
      // 🔥 WORKAROUND: ALWAYS RETURN A transactionId TO VERIFY STATE
      // ---------------------------------------------------------
      let transactionId =
        order?.notes?.transactionId ||
        order?.receipt ||                      // fallback
        razorpay_order_id;                     // LAST RESORT fallback

      if (!order?.notes?.transactionId) {
        console.log("⚠ Razorpay fallback: injecting order.receipt / order_id as transactionId");
      }

      return {
        ok: true,
        message: "Razorpay verified",
        data: {
          status: "paid",
          gatewayPaymentId: razorpay_payment_id,
          gatewayOrderId: razorpay_order_id,
          transactionId,                       // 🔥 CRITICAL FIX
          amount: order?.amount ? order.amount / 100 : null
        }
      };

    } catch (err) {
      console.error("RAZORPAY VERIFY ERROR:", err);
      return {
        ok: false,
        message: "Razorpay verify error",
        raw: err
      };
    }
  }
};
