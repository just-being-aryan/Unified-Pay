import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/useAuth";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
    document.head.appendChild(font);
  }, []);

  return (
    <div className="w-full font-[Montserrat] mt-0 ">

      {/* =============================
      HERO
      ============================= */}
      <section
        className="
          w-full min-h-screen px-10 md:px-20 flex items-center -mt-14
          bg-linear-to-r from-[#5f8fff] via-[#8a6dff] to-[#b26bff]
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full max-w-7xl mx-auto">

          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-black">
              The Unified<br />Payment Layer
            </h1>

            <p className="text-lg md:text-xl mt-6 text-black/80 max-w-md">
              Integrate every Indian payment gateway with a single, minimal, 
              developer-first API.
            </p>

            <div className="mt-10">
              <button
                onClick={() =>
                  !user ? navigate("/auth") : navigate("/projects/create")
                }
                className="
                  bg-black text-white px-10 py-4 rounded-xl 
                  font-semibold hover:bg-gray-900 transition shadow-xl
                "
              >
                Get Started →
              </button>
            </div>
          </div>

          <div className="w-full flex justify-center md:justify-end">
            <div className="bg-white text-black w-[360px] rounded-3xl shadow-2xl p-7 border border-gray-200">
              <h3 className="text-xl font-semibold">Unified Gateway Adapter</h3>

              <div className="mt-4 space-y-3">
                <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                <div className="h-4 bg-gray-200 w-full rounded"></div>
              </div>

              <div
                className="
                  mt-6 bg-gradient-to-r from-[#6ca9ff] to-[#8a6dff]
                  text-white px-4 py-3 rounded-xl font-medium text-center shadow-md
                "
              >
                Standardized Payments API
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =============================
      SECTION 1 — Why UniPay Exists
      ============================= */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          <div>
            <h2 className="text-4xl font-bold mb-6">One API. Every Gateway.</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              No more juggling between PayU, Razorpay, Cashfree, Paytm and others.
              UniPay abstracts the differences and gives you a single, clean interface.
            </p>
            <p className="text-gray-600 text-lg mt-4 leading-relaxed">
              Build once, switch providers anytime — without rewriting your code.
            </p>
          </div>

          <div className="bg-gray-100 rounded-3xl p-10 shadow-inner">
            <pre className="text-sm text-black">
{`// Example: initiate a payment
POST /api/payments/initiate

{
  "gateway": "razorpay",
  "amount": 499,
  "customer": { "email": "test@example.com" }
}`}
            </pre>
          </div>

        </div>
      </section>

      {/* =============================
      SECTION 2 — Integration Visual
      ============================= */}
      <section className="py-24 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">All Gateways. One Unified Flow.</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-16">
            UniPay acts as the compatibility layer between your backend and
            India's most widely used payment providers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {["PayU", "Razorpay", "Cashfree", "Paytm", "Paypal", "Stripe", "CCAvenue", "PhonePe"]
              .map((g, i) => (
                <div
                  key={i}
                  className="bg-white shadow p-6 rounded-2xl text-gray-700 font-semibold border"
                >
                  {g}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* =============================
      SECTION 3 — Use Cases
      ============================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-14">Built For Every Scenario</h2>

        <div className="grid md:grid-cols-3 gap-12">

          <UseCaseCard
            title="Startups"
            desc="Go live quickly without choosing a gateway first. Switch any time."
          />
          <UseCaseCard
            title="Enterprises"
            desc="Route payments through the best performing provider anytime."
          />
          <UseCaseCard
            title="Developers"
            desc="A clean API, transparent logs, unified callbacks, full control."
          />

        </div>
      </section>

      {/* =============================
      CTA
      ============================= */}
      <section className="py-24 text-center bg-gray-100">
        <h2 className="text-4xl font-bold mb-6">Start Building with UniPay</h2>
        <p className="text-gray-600 text-lg mb-10">
          One dashboard. One API. Unlimited scalability.
        </p>

        <button
          onClick={() =>
            !user ? navigate("/auth") : navigate("/projects/create")
          }
          className="
            bg-black text-white px-10 py-4 rounded-xl 
            font-semibold hover:bg-gray-900 transition shadow-xl
          "
        >
          Get Started →
        </button>
      </section>

      <footer className="w-full py-10 bg-gray-50 text-center border-t">
        <h4 className="text-gray-700 font-medium">
          UniPay © {new Date().getFullYear()} 
        </h4>
      </footer>

    </div>
  );
}

function UseCaseCard({ title, desc }) {
  return (
    <div className="p-10 rounded-3xl bg-white shadow-lg border hover:shadow-xl transition">
      <h4 className="text-2xl font-semibold mb-4">{title}</h4>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}
