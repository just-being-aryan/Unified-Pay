import { useNavigate, Link } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import api from "@/api/axios";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (data) => {
    try {
      await api.post("/api/users/register", data);
      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error("Register failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
            <p className="text-gray-600">Join UniPay to get started</p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <a
              href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`}
              className="flex items-center justify-center w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.38c1.62 0..."
                />
              </svg>
              Sign up with Google
            </a>

            <a
              href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/facebook`}
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="white">
                <path d="M22.675 0h-21.35C.597 0..."
                />
              </svg>
              Sign up with Facebook
            </a>

            <a
              href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/linkedin`}
              className="flex items-center justify-center w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v..."
                />
              </svg>
              Sign up with LinkedIn
            </a>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or use email</span>
            </div>
          </div>

          {/* Auth Form */}
          <AuthForm type="register" onSubmit={handleRegister} />

          {/* Footer */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>

        {/* Additional Help */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Need help?{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500 transition-colors">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
