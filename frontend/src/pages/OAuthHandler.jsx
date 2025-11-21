import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

export default function OauthHandler() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      return navigate("/login");
    }

    // Save token and placeholder user (backend does not send profile)
    login(token, {});

    // redirect to home
    navigate("/", { replace: true });
  }, []);

  return (
    <p className="text-center mt-10 text-lg font-medium">
      Signing you in...
    </p>
  );
}
