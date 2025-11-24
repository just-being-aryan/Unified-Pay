import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import api from "@/api/axios";

export default function OauthHandler() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) return navigate("/login");

    localStorage.setItem("token", token);

    api.get("/api/users/profile")
      .then((res) => {
        login(token, res.data.user);
        navigate("/payments", { replace: true });
      })
      .catch(() => navigate("/login"));
  }, []);

  return (
    <p className="text-center mt-10 text-lg font-medium">Logging you in...</p>
  );
}
