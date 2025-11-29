import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api/axios";
import { useAuth } from "@/context/useAuth";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitLogin = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/users/login", {
        email: form.email,
        password: form.password,
      });

      login(res.data.token, res.data.user);
      navigate("/payments");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    try {
      setLoading(true);
      await api.post("/api/users/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      alert("Registered successfully!");
      setMode("login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      alert("Please fill all fields");
      return;
    }

    if (mode === "login") submitLogin();
    else submitRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10">

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in or create your account
        </p>

        {/* Toggle Buttons */}
        <div className="grid grid-cols-2 mb-8 bg-gray-200 p-1 rounded-xl">
          <button
            className={`py-2 rounded-lg font-semibold transition ${
              mode === "login" ? "bg-white shadow" : "text-gray-500"
            }`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>

          <button
            className={`py-2 rounded-lg font-semibold transition ${
              mode === "register" ? "bg-white shadow" : "text-gray-500"
            }`}
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <a
            href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`}
            className="p-3 rounded-full border hover:shadow transition"
          >
            <img src="/google.svg" className="w-6 h-6" />
          </a>

          <a
            href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/facebook`}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition"
          >
            <img src="/facebook.svg" className="w-6 h-6 invert" />
          </a>

          <a
            href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/linkedin`}
            className="p-3 rounded-full bg-blue-700 hover:bg-blue-800 transition"
          >
            <img src="/linkedin.svg" className="w-6 h-6 invert" />
          </a>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
        </div>

        {/* Animated Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? -40 : 40 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full mt-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full mt-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full mt-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </motion.div>
        </AnimatePresence>

        <p className="text-center mt-4 text-sm text-gray-600">
          Need help?{" "}
          <a className="text-indigo-600 hover:text-indigo-500" href="#">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
