import { Link } from "react-router-dom";

export default function Home() {

  console.log("ENV:", import.meta.env.VITE_API_BASE_URL);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center text-center px-6">
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Unified Umbrella Payment Gateway
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mb-8">
        A single platform to manage and process all your payments — across PayU, Razorpay,
        Cashfree, and more — with unified tracking, logs, and analytics.
      </p>
      <Link
        to="/payments"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition"
      >
        Make your first Payment Now !
      </Link>
    </div>
  );
}
