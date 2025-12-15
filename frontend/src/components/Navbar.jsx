import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/useAuth";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Payments", path: "/payments" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/projects" },
    {name : "SDK", path : "/sdk"}
  ];

  const handleProtected = (path) => {
    if (!user) return navigate("/auth");
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 border-b border-gray-200/40 dark:border-gray-700/40">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          UniPay
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">

          {navLinks.map((link) =>
            link.name === "Payments" ? (
              <button
                key={link.name}
                className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition"
                onClick={() => handleProtected(link.path)}
              >
                {link.name}
              </button>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition"
              >
                {link.name}
              </Link>
            )
          )}

          {/* Auth Buttons */}
          {!user ? (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
            >
              Sign in
            </Link>
          ) : (
            <button
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-800 dark:text-gray-200"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 space-y-4">
          
          {navLinks.map((link) =>
            link.name === "Payments" ? (
              <button
                key={link.name}
                className="block w-full text-left text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium"
                onClick={() => {
                  setMobileOpen(false);
                  handleProtected(link.path);
                }}
              >
                {link.name}
              </button>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium"
              >
                {link.name}
              </Link>
            )
          )}

          {!user ? (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2 rounded-lg bg-gray-900 text-white font-medium"
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
                navigate("/");
              }}
              className="w-full px-4 py-2 rounded-lg bg-black-800 text-black font-medium"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
