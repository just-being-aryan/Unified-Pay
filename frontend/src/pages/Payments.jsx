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
    console.log("Selected Gateway:", gateway);

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
          successUrl: `${FRONTEND_BASE}/payments/success`,
          failureUrl: `${FRONTEND_BASE}/payments/failure`,
          notifyUrl: `${API_BASE}/api/payments/callback/${gateway}`,
        },
        meta: {
          description: description || "Payment",
        },
      };

      const res = await api.post("/api/payments/initiate", payload);
      const response = res.data?.data || res.data;

      console.log("Payment Response:", response);

      // Handle redirect_form method (Paytm v1 hosted checkout)
      if (response?.paymentMethod === "redirect_form" && response?.redirectUrl && response?.formData) {
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

    // FIX: delay submit to escape React event loop
    setTimeout(() => {
      form.submit();
    }, 10);

    return;
}


      // Handle POST method (PayU)
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

      // Handle direct redirect (Cashfree, etc.)
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      // Unexpected response
      console.error("Unexpected response format:", response);
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
              <option value="paytm">Paytm</option>
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