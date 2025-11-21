import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      return navigate("/login");
    }

    // Save token
    localStorage.setItem("token", token);

    // Fetch user profile using token
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return navigate("/login");

        login(token, data.user);
        navigate("/payments");
      })
      .catch(() => navigate("/login"));
  }, []);

  return <p className="text-center mt-10">Logging you in...</p>;
}
