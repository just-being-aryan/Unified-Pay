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
    <>
      <AuthForm type="register" onSubmit={handleRegister} />
      <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Login
        </Link>
      </p>
    </>
  );
}
