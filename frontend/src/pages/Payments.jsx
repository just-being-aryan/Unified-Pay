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

  // Load Razorpay JS
  useEffect(() => {
    const existing = document.querySelector("#razorpay-sdk");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => console.log("Razorpay SDK Loaded");
    script.onerror = () => console.error("Failed to load Razorpay SDK");
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

      const payload = {
        gateway,
        amount: parseFloat(amount),
        currency: "INR",
        transactionId,
        customer: {
          name: user?.name || "Guest User",
          email: user?.email || "guest@example.com",
          phone: user?.phone || "9999999999",
        },
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

      console.log("Sending payment request:", payload);

      const res = await api.post("/api/payments/initiate", payload);
      const response = res.data?.data || res.data;

      console.log("Initiate response:", response);

      // ---------------------------
      // RAZORPAY JS CHECKOUT (FIXED)
      // ---------------------------
      if (response.paymentMethod === "razorpay_js") {
        if (!window.Razorpay) {
          alert("Razorpay SDK did not load");
          return;
        }

        const options = {
          key: response.key,
          amount: response.amount,
          currency: response.currency,
          name: "UnifiedPay",
          order_id: response.orderId,

          // ⭐ HANDLER MODE — NO CALLBACK_URL, NO REDIRECT
          handler: function (resp) {
  const verifyUrl =
    `${API_BASE}/api/payments/callback/razorpay` +
    `?razorpay_payment_id=${resp.razorpay_payment_id}` +
    `&razorpay_order_id=${resp.razorpay_order_id}` +
    `&razorpay_signature=${resp.razorpay_signature}` +
    `&txnid=${response.transactionId}`;   // ⭐ ADD THIS ⭐

  window.location.href = verifyUrl;
},


          prefill: response.prefill,

          theme: {
            color: "#3399cc",
          },
        };

        console.log("Opening Razorpay with options:", options);

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
        return;
      }

      // ---------------------------
      // FORM REDIRECT (PayU, Paytm)
      // ---------------------------
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

      // ---------------------------
      // DIRECT URL REDIRECT (Cashfree)
      // ---------------------------
      if (response.paymentMethod === "redirect_url" && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      console.error("Unexpected response:", response);
      alert("Unexpected response");

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
