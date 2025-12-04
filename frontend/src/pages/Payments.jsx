// frontend/src/pages/Payments.jsx
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useAuth } from "@/context/useAuth";

export default function Payments() {
  const { user } = useAuth();

  const [gateway, setGateway] = useState("payu");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const FRONTEND_BASE = window.location.origin;

  // OPTIONAL: ?project=xxxx
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project") || null;

  // Razorpay SDK loader
  useEffect(() => {
    if (document.querySelector("#razorpay-sdk")) return;

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const sanitizePhone = (phone) => {
    const num = (phone || "").trim();
    return /^[0-9]{8,15}$/.test(num) ? num : ""; // Cashfree-safe
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!amount) return alert("Enter amount");

    try {
      setLoading(true);

      const transactionId = `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Sanitize phone - only include if valid
      const sanitizedPhone = (() => {
        const num = (user?.phone || "").trim();
        return /^[0-9]{8,15}$/.test(num) ? num : null;
      })();

      // Final sanitized customer object - exclude phone if invalid
      const sanitizedCustomer = {
        name: user?.name || "Guest User",
        email: user?.email || "guest@example.com",
        ...(sanitizedPhone ? { phone: sanitizedPhone } : {}),
      };

      const payload = {
        projectId: projectId || undefined,
        gateway,
        amount: parseFloat(amount),
        currency: "INR",
        transactionId,

        userId: user?._id || user?.id,

        customer: sanitizedCustomer,

        redirect: {
          successUrl: `${FRONTEND_BASE}/payments/success`,
          failureUrl: `${FRONTEND_BASE}/payments/failure`,
          notifyUrl: `${API_BASE}/api/payments/callback/${gateway}`,
        },

        meta: {
          description: description || "Payment",
          linkPurpose: "ORDER_PAYMENT",
          linkTitle: description || "Payment",
        },
      };

      const res = await api.post("/api/payments/initiate", payload);
      const response = res.data?.data || res.data;

      // ─────────────── PAYTM JS ───────────────
      if (response.paymentMethod === "paytm_js") {
        const script = document.createElement("script");
        script.src = `https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${response.mid}.js`;
        script.async = true;

        script.onload = () => {
          const config = {
            root: "",
            flow: "DEFAULT",
            data: {
              orderId: response.orderId,
              token: response.txnToken,
              tokenType: "TXN_TOKEN",
              amount: response.amount,
            },
          };

          window.Paytm.CheckoutJS.init(config)
            .then(() => window.Paytm.CheckoutJS.invoke())
            .catch(console.error);
        };

        document.body.appendChild(script);
        return;
      }

      // ─────────────── RAZORPAY ───────────────
      if (response.paymentMethod === "razorpay_js") {
  if (!window.Razorpay) {
    alert("Razorpay SDK not loaded");
    return;
  }

  const contact =
    sanitizedCustomer.phone ||
    response.prefill?.contact ||
    "9999999999";

  const options = {
    key: response.key,
    amount: String(response.amount), // ENSURE STRING
    currency: response.currency,
    name: "UnifiedPay",
    order_id: response.orderId,

    prefill: {
      name: sanitizedCustomer.name,
      email: sanitizedCustomer.email,
      contact: contact ? String(contact) : ""
    },

    handler: async (resp) => {
      try {
        const verifyRes = await api.post(`/api/payments/callback/razorpay`, {
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_signature: resp.razorpay_signature,
          txnid: response.transactionId,
        });

        const status = verifyRes.data?.data?.status || "unknown";

        window.location.href =
          status === "paid"
            ? `/payments/success?txnid=${response.transactionId}`
            : `/payments/failure?txnid=${response.transactionId}&status=${status}`;
      } catch (err) {
        window.location.href = `/payments/failure?txnid=${response.transactionId}&status=failed`;
      }
    },

    theme: { color: "#3399cc" },
  };

  const rz = new window.Razorpay(options);
  rz.open();
  return;
}



      // ─────────────── REDIRECT FORM (PayU, others) ───────────────
      if (
        response.paymentMethod === "redirect_form" &&
        response.redirectUrl &&
        response.formData
      ) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = response.redirectUrl;

        Object.entries(response.formData).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // ─────────────── SIMPLE REDIRECT (Cashfree) ───────────────
      if (response.paymentMethod === "redirect_url" && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      alert("Unexpected payment response");
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Initiate Payment
        </h2>

        <form onSubmit={handlePayment} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Select Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="payu">PayU</option>
              <option value="paytm">Paytm</option>
              <option value="paypal">PayPal</option>
              <option value="cashfree">Cashfree</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>

        {user && (
          <div className="mt-4 text-sm text-gray-600">
            Paying as: {user.name || user.email}
          </div>
        )}
      </div>
    </div>
  );
}
