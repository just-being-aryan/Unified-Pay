import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function Home() {

  // Montserrat font injection (global)
  useEffect(() => {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
    document.head.appendChild(font);
  }, []);

  const gateways = [
    "PayU",
    "Razorpay",
    "Cashfree",
    "Paytm",
    "Paypal",
    "PhonePe",
    "CCAvenue",
    "Stripe",
    "Amazon Pay",
  ];

  return (
    <div className="w-full font-[Montserrat]">

      {/* ============================
          HERO SECTION
      ============================ */}
      <section className="min-h-[90vh] flex flex-col justify-center items-center text-center px-6 pt-24">
        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent animate-fadeIn">
          UniPay
        </h1>

        <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100 max-w-3xl leading-tight animate-slideUp">
          A Unified Payment Gateway Layer That Integrates Every Major Indian Provider
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mt-6 mb-10 animate-fadeInSlow">
          Simplify your payment infrastructure.  
          Connect PayU, Razorpay, Cashfree, Paytm, Stripe, and more — all under one single API,
          one dashboard, one experience.
        </p>

        <Link
          to="/payments"
          className="px-8 py-4 bg-blue-700 text-white rounded-xl text-lg font-medium hover:bg-blue-800 transition shadow-lg animate-bounceSlow"
        >
          Make Your First Payment
        </Link>
      </section>

      {/* ============================
          SCROLLING CAROUSEL
      ============================ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-y">
        <h3 className="text-center text-2xl font-semibold mb-8 text-gray-800 dark:text-gray-100">
          Supported Payment Gateways
        </h3>

        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee space-x-16 text-xl font-medium text-gray-700 dark:text-gray-300">
            {gateways.map((g, i) => (
              <span
                key={i}
                className="inline-block px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 shadow-sm"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          HOW IT WORKS
      ============================ */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          How UniPay Works
        </h3>

        <div className="grid md:grid-cols-3 gap-10">

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 shadow">
            <h4 className="text-xl font-semibold mb-3 text-blue-700">1. Choose Gateway</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Select any payment provider — PayU, Razorpay, Cashfree, etc.  
              No more switching between multiple integrations.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 shadow">
            <h4 className="text-xl font-semibold mb-3 text-blue-700">2. Process Payment</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Your request is routed through UniPay’s unified adapter layer.  
              Everything is standardized.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 shadow">
            <h4 className="text-xl font-semibold mb-3 text-blue-700">3. Track & Analyse</h4>
            <p className="text-gray-600 dark:text-gray-400">
              View all transactions from all gateways in one dashboard with insights and logs.
            </p>
          </div>
        </div>
      </section>

      {/* ============================
          FEATURES SECTION
      ============================ */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-14">
          Why Developers Love UniPay
        </h3>

        <div className="grid md:grid-cols-3 gap-12">
          <FeatureCard title="Unified API" desc="One API to integrate all payment gateways." />
          <FeatureCard title="Adapter Architecture" desc="Swap gateways without changing core code." />
          <FeatureCard title="Complete Logs" desc="Log requests & responses for every provider." />
          <FeatureCard title="Analytics Ready" desc="Trends, graphs, failure reasons — all built in." />
          <FeatureCard title="Secure & Modular" desc="RBAC, API keys, secure callback architecture." />
          <FeatureCard title="Easy to Extend" desc="Add new providers in minutes, not weeks." />
        </div>
      </section>

      {/* ============================
          FOOTER
      ============================ */}
      <footer className="w-full py-10 bg-gray-100 dark:bg-gray-800 text-center mt-20">
        <h4 className="text-gray-800 dark:text-gray-300 font-semibold">
          UniPay © {new Date().getFullYear()} — All Rights Reserved
        </h4>
      </footer>

    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="p-10 rounded-3xl bg-white dark:bg-gray-900 shadow hover:shadow-xl transition">
      <h4 className="text-xl font-semibold mb-4 text-blue-700">{title}</h4>
      <p className="text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
