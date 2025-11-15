import axios from "axios";

export default {
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

      const { appId, secretKey, baseUrl } = config;

      if (!appId || !secretKey || !baseUrl) {
        return {
          ok: false,
          message: "Invalid Cashfree configuration",
        };
      }

      
      const formattedAmount = Number(amount);

      
      const returnUrl = `${redirect.successUrl}?txnid=${transactionId}`;

      
      const payload = {
        link_id: transactionId,
        link_amount: formattedAmount,
        link_currency: currency,

       
        link_purpose: meta.description || "Payment Processing",

        customer_details: {
          customer_name: customer.name || "",
          customer_email: customer.email || "",
          customer_phone: customer.phone || "",
        },

        link_meta: {
          return_url: returnUrl,
          notify_url: redirect.notifyUrl, 
          redirect_on_failure: `${redirect.failureUrl}?txnid=${transactionId}`,
        },

        link_notes: {
          description: meta.description || "",
        },
      };

      console.log("Cashfree Payment Link Payload:", payload);

      
      const response = await axios.post(
        `${baseUrl}/links`,
        payload,
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
        message: "Cashfree initiatePayment success",
        data: {
          method: "GET",
          redirectUrl: data?.link_url,//this is cashfree payment url
          orderId: data?.link_id,
          paymentSessionId: data?.cf_link_id,
        },
        raw: data,
      };
    } catch (error) {
      console.error(
        " Cashfree initiatePayment error:",
        error.response?.data || error
      );
      return {
        ok: false,
        message: "Cashfree initiatePayment failed",
        statusCode: 500,
        raw: error.response?.data || error.message,
      };
    }
  },

  verifyPayment: async (input) => {
    try {
      const { callbackPayload, config = {} } = input;
      const { appId, secretKey, baseUrl } = config;

      if (!appId || !secretKey || !baseUrl) {
        return {
          ok: false,
          message: "Invalid Cashfree config in verifyPayment",
        };
      }

      const linkId =
        callbackPayload.link_id ||
        callbackPayload.order_id ||
        callbackPayload.orderId ||
        callbackPayload?.data?.link_id;

      if (!linkId) {
        return {
          ok: false,
          message: "Missing link_id in callback",
        };
      }

      
      const response = await axios.get(
        `${baseUrl}/links/${linkId}`,
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
      

      let normalized = "processing";
      if (data.link_status === "PAID") normalized = "paid";
      else if (["EXPIRED", "CANCELLED", "FAILED"].includes(data.link_status))
        normalized = "failed";

      return {
        ok: true,
        status: normalized,
        data: {
          status: normalized,
          gatewayPaymentId: data.cf_link_id,
          gatewayOrderId: data.link_id,
          amount: data.link_amount,
        },
        raw: data,
      };
    } catch (error) {
      console.error(
        " Cashfree verifyPayment error:",
        error.response?.data || error
      );
      return {
        ok: false,
        status: "failed",
        message: "Cashfree verification error",
        raw: error.response?.data || error.message,
      };
    }
  },

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
      console.error(" Cashfree refund error:", err.response?.data || err);
      return {
        ok: false,
        message: "Cashfree refundPayment error",
        raw: err.response?.data || err.message,
      };
    }
  },
};
