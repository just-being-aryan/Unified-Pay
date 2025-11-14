import { useNavigate, Link } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/useAuth";
import api from "@/api/axios";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (data) => {
    try {
      const res = await api.post("/api/users/login", data);

      login(res.data.token, res.data.user);

      navigate("/payments");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <>
      <AuthForm type="login" onSubmit={handleLogin} />
      <p className="text-center mt-4">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </>
  );
}
