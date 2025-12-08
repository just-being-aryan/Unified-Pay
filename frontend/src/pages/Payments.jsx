// frontend/src/pages/Payments.jsx
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useAuth } from "@/context/useAuth";

export default function Payments({
  projectId: injectedProjectId = null,
  allowedGateways = null,
}) {
  const { user } = useAuth();

  const [gateway, setGateway] = useState("payu");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const FRONTEND_URL = window.location.origin;

  const urlParams = new URLSearchParams(window.location.search);
  const urlProjectId = urlParams.get("project") || null;
  const projectId = injectedProjectId || urlProjectId;

  // Load Razorpay SDK
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!amount) return alert("Enter amount");

    try {
      setLoading(true);

      const transactionId = `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const sanitizedPhone = (() => {
        const num = (user?.phone || "").trim();
        return /^[0-9]{8,15}$/.test(num) ? num : null;
      })();

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
          successUrl: `${FRONTEND_URL}/payments/success`,
          failureUrl: `${FRONTEND_URL}/payments/failure`,
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

      // ░░░ PAYTM JS ░░░
      if (response.paymentMethod === "paytm_js") {
        // ... unchanged Paytm block ...
        return;
      }

      // ░░░ RAZORPAY JS (FIXED) ░░░
      if (response.paymentMethod === "razorpay_js") {
        if (!window.Razorpay) {
          alert("Razorpay SDK not loaded");
          setLoading(false);
          return;
        }

        const contact =
          sanitizedCustomer.phone ||
          response.prefill?.contact ||
          "9999999999";

        const options = {
          key: response.key,
          amount: String(response.amount),
          currency: response.currency,
          name: "UnifiedPay",
          order_id: response.orderId,

          // IMPORTANT: USE BACKEND CALLBACK URL
          callback_url: response.callbackUrl,
          redirect: true,

          prefill: {
            name: sanitizedCustomer.name,
            email: sanitizedCustomer.email,
            contact,
          },

          theme: { color: "#3399cc" },
        };

        console.log("=== RAZORPAY OPTIONS ===", options);

        const rz = new window.Razorpay(options);

        // Only handle payment.failed event
        rz.on("payment.failed", async (fail) => {
          console.error("Payment failed:", fail);
          window.location.href = `/payments/failure?txnid=${response.transactionId}&status=failed`;
        });

        rz.open();
        setLoading(false);
        return;
      }

      // ░░░ PAYU / REDIRECT FORM ░░░
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

      // ░░░ SIMPLE REDIRECT (Cashfree) ░░░
      if (response.paymentMethod === "redirect_url") {
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
        <h2 className="text-2xl font-bold text-center mb-6">Initiate Payment</h2>

        <form onSubmit={handlePayment} className="space-y-5">
          <div>
            <label className="block mb-1">Amount (₹)</label>
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
            <label className="block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-1">Select Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {(allowedGateways ||
                ["payu", "paytm", "paypal", "cashfree", "razorpay"]
              ).map((g) => (
                <option key={g} value={g}>
                  {g.toUpperCase()}
                </option>
              ))}
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
