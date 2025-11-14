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

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!amount) return alert("Please enter an amount");

    try {
      setLoading(true);

      const payload = {
        gateway,
        amount,
        currency: "INR",
        customer: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone || "9999999999",
        },
        redirect: {
          successUrl: `${API_BASE}/api/payments/callback/${gateway}`,
          failureUrl: `${API_BASE}/api/payments/callback/${gateway}`,
        },
        meta: {
          description: description || "Payment",
        },
      };

      console.log("📤 Sending Payload:", payload);

      const res = await api.post("/api/payments/initiate", payload);
      const response = res.data?.data || res.data;

      // PAYU: POST auto-form
      if (response?.method === "POST" && response?.actionUrl) {
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
        form.submit();
        return;
      }

      // Other gateways (if return redirectUrl)
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      console.error("Unexpected Response:", JSON.stringify(response, null, 2));
      alert("Unexpected response. Check console logs.");
    } catch (err) {
      console.error("Payment initiation failed:", err.response?.data || err);
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
            <label className="block text-sm mb-1">Amount (₹)</label>
            <input
              type="number"
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
              placeholder="Test Payment"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Select Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="payu">PayU</option>
              <option value="razorpay">Razorpay</option>
              <option value="cashfree">Cashfree</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
}
