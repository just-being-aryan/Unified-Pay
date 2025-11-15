import crypto from "crypto";
import axios from "axios";

const DEFAULT_PAYU_TEST_URL = "https://test.payu.in/_payment";

const payuConfig = {
  key: process.env.PAYU_MERCHANT_KEY,
  salt: process.env.PAYU_MERCHANT_SALT,
  baseUrl: process.env.PAYU_BASE_URL
};

export default {
  initiatePayment: async (input) => {
    try {
      const {
        amount,
        currency = "INR",
        transactionId,
        customer = {},
        meta = {},
        redirect = {},
        config: payuConfig,
      } = input;

      const { key, salt, baseUrl = DEFAULT_PAYU_TEST_URL } = payuConfig || {};

      if (!key || !salt) {
        return {
          ok: false,
          message: "Invalid PayU configuration: missing key or salt",
        };
      }

      const formattedAmount = Number(amount).toFixed(2);

      //payment success and failure URLS
      const surl = redirect.successUrl || redirect.success || "";
      const furl = redirect.failureUrl || redirect.failure || "";

      const params = {
        key,
        txnid: transactionId,
        amount: formattedAmount,
        productinfo: meta.productInfo || meta.productinfo || "Product",
        firstname: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        surl,
        furl,
        udf1: meta.udf1 || "",
        udf2: meta.udf2 || "",
        udf3: meta.udf3 || "",
        udf4: meta.udf4 || "",
        udf5: meta.udf5 || "",
      };

      // Validate ALL required PayU fields
      if (!params.txnid || !params.amount || !params.firstname || !params.email) {
        return {
          ok: false,
          message:
            "Missing required PayU parameters (txnid, amount, firstname, email).",
          data: { params },
        };
      }

      // Validate redirect URLs (PayU mandatory fields)
      if (!params.surl || !params.furl) {
        return {
          ok: false,
          message: "Missing required redirect URLs (surl, furl). Please provide redirect.successUrl and redirect.failureUrl",
          data: { 
            params,
            provided: {
              surl: params.surl,
              furl: params.furl
            }
          },
        };
      }

      // Validate phone number
      if (!params.phone) {
        return {
          ok: false,
          message: "Missing required parameter: phone number",
          data: { params },
        };
      }

      // PayU hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
      const hashString = [
        key,
        params.txnid,
        params.amount,
        params.productinfo,
        params.firstname,
        params.email,
        params.udf1,
        params.udf2,
        params.udf3,
        params.udf4,
        params.udf5,
        "", 
        "", 
        "", 
        "", 
        "", 
        salt,
      ].join("|");

      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      return {
        ok: true,
        message: "PayU initiatePayment success",
        data: {
          method: "POST",
          actionUrl: baseUrl,
          params: {
            ...params,
            hash,
          },
        },
        raw: {
          hashString,
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: "PayU initiatePayment failed",
        raw: error?.message || String(error),
      };
    }
  },

  verifyPayment: async (input) => {
    try {
      const { callbackPayload, config = {} } = input;

      if (!callbackPayload) {
        return {
          ok: false,
          message: "Missing callback payload",
        };
      }

      const {
        txnid,
        status,
        mihpayid,
        hash,
        amount,
        productinfo,
        firstname,
        email,
        udf1 = "",
        udf2 = "",
        udf3 = "",
        udf4 = "",
        udf5 = "",
      } = callbackPayload;

      const { key, salt } = config;

      if (!key || !salt) {
        return {
          ok: false,
          message: "Invalid PayU configuration",
        };
      }

     
      const hashStringSuccess = [
        salt,
        status,
        "",
        "",
        "",
        "",
        "",
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        key,
      ].join("|");

      const expectedHash = crypto
        .createHash("sha512")
        .update(hashStringSuccess)
        .digest("hex");

      const signatureValid = expectedHash === (hash || "");

      if (!signatureValid) {
        return {
          ok: false,
          message: "Signature mismatch",
          data: {
            status: "failed",
          },
          raw: {
            receivedHash: hash,
            computedHash: expectedHash,
            callbackPayload,
          },
        };
      }

      let normalizedStatus = "processing";
      switch ((status || "").toLowerCase()) {
        case "success":
          normalizedStatus = "paid";
          break;
        case "failure":
        case "failed":
          normalizedStatus = "failed";
          break;
        default:
          normalizedStatus = "processing";
      }

      return {
        ok: true,
        message: "PayU verification success",
        data: {
          status: normalizedStatus,
          gatewayPaymentId: mihpayid,
          gatewayOrderId: txnid,
          amount,
        },
        raw: callbackPayload,
      };
    } catch (err) {
      return {
        ok: false,
        message: "PayU verification error",
        raw: err?.message || String(err),
      };
    }
  },

  refundPayment: async (input) => {
    try {
      const { gatewayPaymentId, amount, reason, config = {} } = input;

      if (!gatewayPaymentId) {
        return {
          ok: false,
          message: "gatewayPaymentId (mihpayid) is required",
        };
      }

      const { key, salt } = config;

      if (!key || !salt) {
        return {
          ok: false,
          message: "Invalid PayU configuration",
        };
      }

      const command = "cancel_refund_transaction";
      const var1 = gatewayPaymentId;
      const var2 = amount ? String(amount) : "";
      const var3 = reason || "";

      const hashString = `${key}|${command}|${var1}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const payload = new URLSearchParams({
        key,
        command,
        hash,
        var1,
        var2,
        var3,
      });

      const response = await axios.post(
        "https://test.payu.in/merchant/postservice?form=2",
        payload.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const data = response.data;

      return {
        ok: true,
        message: "PayU refund processed",
        data: {
          status: data?.status === "success" ? "refunded" : "processing",
          refundId: data?.refundId || null,
          amount: amount || null,
        },
        raw: data,
      };
    } catch (err) {
      return {
        ok: false,
        message: "PayU refundPayment error",
        raw: err.response?.data || err.message || String(err),
      };
    }
  },
};