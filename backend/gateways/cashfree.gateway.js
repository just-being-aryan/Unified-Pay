import axios from "axios";

export default {
  // =========================================================
  // INITIATE PAYMENT (Cashfree)
  // =========================================================
  initiatePayment: async (input) => {
    try {
      const APP_ID = process.env.CASHFREE_APP_ID;
      const SECRET = process.env.CASHFREE_SECRET_KEY;
      const BASE_URL = (process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg").replace(/\/$/, "");

      if (!APP_ID || !SECRET) {
        return {
          ok: false,
          message: "Invalid Cashfree configuration: CASHFREE_APP_ID or CASHFREE_SECRET_KEY missing",
        };
      }

      const { amount, transactionId, redirect = {}, customer = {}, meta = {}, currency = "INR" } = input;

      if (!amount || !transactionId) {
        return { ok: false, message: "Missing amount or transactionId for Cashfree initiate" };
      }

      const txnAmount = Number(amount).toFixed(2);

      // Create Cashfree Payment Link
      try {
        const payload = {
          link_amount: txnAmount,
          link_currency: currency,
          link_note: meta?.description || "Payment",
          link_purpose: meta?.linkPurpose || "ORDER_PAYMENT",
          link_title: meta?.linkTitle || (meta?.description || "Payment"),
          customer_details: {
            customer_name: customer?.name || "",
            customer_email: customer?.email || "",
            customer_phone: customer?.phone || "",
          },
          // Backend webhook for verification (server-to-server)
          notify_url: redirect.notifyUrl,
          // User redirect after successful payment (browser redirect)
          return_url: redirect.successUrl || redirect.returnUrl || redirect.notifyUrl,
          // User redirect on cancel/failure
          cancel_url: redirect.failureUrl || redirect.cancelUrl,
        };

        console.log("Cashfree create link payload:", payload);

        const linksEndpoint = `${BASE_URL}/links`;

        const resp = await axios.post(linksEndpoint, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-client-id": APP_ID,
            "x-client-secret": SECRET,
            "x-api-version": "2023-08-01",
          },
          timeout: 10000,
        });

        console.log("Cashfree create link response:", resp.data);

        // Extract link_url from response
        const linkUrl = resp.data?.link_url;
        const linkId = resp.data?.link_id || resp.data?.cf_link_id;

        if (linkUrl) {
          console.log("✅ Cashfree link created successfully:", linkUrl);
          
          return {
            ok: true,
            message: "Cashfree initiate success",
            data: {
              paymentMethod: "redirect_url",
              redirectUrl: linkUrl,
              gatewayOrderId: linkId || transactionId,
              raw: resp.data,
            },
          };
        }

        console.warn("❌ Cashfree: create link succeeded but no link_url returned", resp.data);
        
        return {
          ok: false,
          message: "Cashfree link created but no URL returned",
          raw: resp.data,
        };
        
      } catch (err) {
        console.error("❌ Cashfree create link error:", err.response?.data || err.message || err);
        
        return {
          ok: false,
          message: "Cashfree link creation failed",
          raw: err.response?.data || err.message,
        };
      }
    } catch (err) {
      console.error("CASHFREE INITIATE ERROR:", err.response?.data || err.message || err);
      return {
        ok: false,
        message: "Cashfree initiate error",
        raw: err.response?.data || err?.message,
      };
    }
  },

  // =========================================================
  // VERIFY PAYMENT (Cashfree)
  // =========================================================
  verifyPayment: async (input) => {
    try {
      const { callbackPayload } = input;

      // Log payload for debugging
      console.log("CASHFREE CALLBACK PAYLOAD:", JSON.stringify(callbackPayload || {}, null, 2));

      // Common identifiers returned by Cashfree link/webhook/redirect
      const gatewayOrderId =
        callbackPayload?.link_id ||
        callbackPayload?.cf_link_id ||
        callbackPayload?.order_id ||
        callbackPayload?.orderId ||
        callbackPayload?.referenceId ||
        callbackPayload?.orderRef ||
        callbackPayload?.payment_request_id ||
        null;

      const gatewayPaymentId =
        callbackPayload?.payment_id ||
        callbackPayload?.cf_payment_id ||
        callbackPayload?.paymentRequestId ||
        callbackPayload?.transaction_id ||
        null;

      // Try to find status in payload across different possible keys
      const rawStatus =
        (callbackPayload?.payment_status ||
          callbackPayload?.status ||
          callbackPayload?.order_status ||
          callbackPayload?.txStatus ||
          callbackPayload?.paymentStatus ||
          callbackPayload?.transaction_status ||
          "")
          .toString()
          .toLowerCase();

      const normalized =
        {
          paid: "paid",
          success: "paid",
          captured: "paid",
          completed: "paid",
          settled: "paid",
          pending: "processing",
          initiated: "processing",
          created: "processing",
          failed: "failed",
          declined: "failed",
          cancelled: "failed",
          voided: "failed",
        }[rawStatus] || (rawStatus.includes("success") ? "paid" : (rawStatus.includes("fail") ? "failed" : "processing"));

      const amount =
        callbackPayload?.amount ||
        callbackPayload?.orderAmount ||
        callbackPayload?.link_amount ||
        callbackPayload?.payment_amount ||
        null;

      return {
        ok: true,
        message: "Cashfree verified",
        data: {
          status: normalized,
          gatewayPaymentId: gatewayPaymentId,
          gatewayOrderId: gatewayOrderId,
          amount: amount,
        },
      };
    } catch (err) {
      console.error("CASHFREE VERIFY ERROR:", err?.message || err);
      return {
        ok: false,
        message: "Cashfree verify error",
        raw: err?.message || err,
      };
    }
  },

  // =========================================================
  // REFUND PAYMENT (Cashfree)
  // =========================================================
  refundPayment: async (input) => {
    try {
      const { gatewayOrderId, amount, reason, config = {} } = input;
      const { appId, secretKey, baseUrl } = config;

      if (!gatewayOrderId)
        return { ok: false, message: "gatewayOrderId is required" };

      const refundPayload = {
        refund_amount: Number(amount) || undefined,
        refund_note: reason || "Refund",
      };

      const response = await axios.post(
        `${baseUrl}/links/${gatewayOrderId}/refunds`,
        refundPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2023-08-01",
          },
        }
      );

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
      console.error("Cashfree refund error:", err.response?.data || err);
      return {
        ok: false,
        message: "Cashfree refundPayment error",
        raw: err.response?.data || err.message,
      };
    }
  },
};