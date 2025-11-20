// frontend/src/pages/Payments.jsx
import { useState } from "react";
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

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!amount) return alert("Please enter an amount");

    try {
      setLoading(true);

      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

      console.log("🚀 Sending payment request:", payload);

      const res = await api.post("/api/payments/initiate", payload);
      
      console.log("📦 RAW AXIOS RESPONSE:");
      console.log("Status:", res.status);
      console.log("Headers:", res.headers);
      console.log("Full res.data:", JSON.stringify(res.data, null, 2));

      const response = res.data?.data || res.data;

      console.log("📊 EXTRACTED RESPONSE:");
      console.log("Response:", JSON.stringify(response, null, 2));
      console.log("Type of response:", typeof response);
      console.log("Is Array?", Array.isArray(response));
      console.log("Keys:", Object.keys(response));

      // Check all possible locations for redirect data
      console.log("🔍 SEARCHING FOR REDIRECT DATA:");
      console.log("response.paymentMethod:", response?.paymentMethod);
      console.log("response.redirectUrl:", response?.redirectUrl);
      console.log("response.data?.paymentMethod:", response?.data?.paymentMethod);
      console.log("response.data?.redirectUrl:", response?.data?.redirectUrl);
      console.log("res.data.paymentMethod:", res.data?.paymentMethod);
      console.log("res.data.redirectUrl:", res.data?.redirectUrl);
      console.log("res.data.data?.paymentMethod:", res.data?.data?.paymentMethod);
      console.log("res.data.data?.redirectUrl:", res.data?.data?.redirectUrl);

      // Handle redirect_form method
      if (response?.paymentMethod === "redirect_form" && response?.redirectUrl && response?.formData) {
        console.log("✅ REDIRECT_FORM METHOD");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = response.redirectUrl;

        Object.entries(response.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        setTimeout(() => form.submit(), 100);
        return;
      }

      // Handle POST method (PayU)
      if (response?.method === "POST" && response?.actionUrl) {
        console.log("✅ POST METHOD");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = response.actionUrl;

        Object.entries(response.params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        setTimeout(() => form.submit(), 100);
        return;
      }

      // Handle direct redirect (Cashfree Payment Link)
      if (response?.paymentMethod === "redirect_url" && response?.redirectUrl) {
        console.log("✅ REDIRECT_URL METHOD DETECTED!");
        console.log("Redirecting to:", response.redirectUrl);
        
        // Try immediate redirect
        window.location.href = response.redirectUrl;
        return;
      }

      // Also check if data is nested one level deeper
      if (response?.data?.paymentMethod === "redirect_url" && response?.data?.redirectUrl) {
        console.log("✅ REDIRECT_URL IN NESTED DATA!");
        console.log("Redirecting to:", response.data.redirectUrl);
        window.location.href = response.data.redirectUrl;
        return;
      }

      // Unexpected response
      console.error("❌ UNEXPECTED RESPONSE FORMAT");
      console.error("Could not find paymentMethod or redirectUrl in expected locations");
      console.error("Full response object:", response);
      alert("Unexpected response format. Check console for details.");
    } catch (err) {
      console.error("❌ PAYMENT ERROR:", err);
      console.error("Error response:", err.response?.data);
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
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Test Payment"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              Select Gateway
            </label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="payu">PayU</option>
              <option value="paytm">Paytm</option>
              <option value="paypal">PayPal</option>
              <option value="cashfree">Cashfree</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>

        {user && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Paying as:</strong> {user.name || user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}