import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import api from "@/api/axios";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  // AUTO RESTORE USER ON PAGE RELOAD
  useEffect(() => {
    const restoreUser = async () => {
      if (!token) return;

      try {
        const res = await api.get("/api/users/profile");

        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user)); 
        } else {
          logout();
        }
      } catch (err) {
        logout();
      }
    };

    // Only restore if we don't already have user loaded
    if (token && !user) restoreUser();
  }, [token]);

  const login = (jwtToken, userData) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
