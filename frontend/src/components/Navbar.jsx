import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/useAuth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Payments", path: "/payments" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Transactions", path: "/transactions" },
    { name: "Gateways", path: "/gateway" },
  ];

  const handleProtectedNav = (path) => {
    if (!user) return navigate("/login");
    navigate(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            UmbrellaPay
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) =>
              link.name === "Payments" ? (
                <button
                  key={link.name}
                  onClick={() => handleProtectedNav(link.path)}
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-500 transition"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-500 transition"
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <Link
                to="/login"
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 dark:text-gray-200"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-2">

            {navLinks.map((link) =>
              link.name === "Payments" ? (
                <button
                  key={link.name}
                  onClick={() => {
                    setIsOpen(false);
                    handleProtectedNav(link.path);
                  }}
                  className="block w-full text-left text-gray-700 dark:text-gray-200 hover:text-blue-500 transition"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 dark:text-gray-200 hover:text-blue-500 transition"
                >
                  {link.name}
                </Link>
              )
            )}

            {!user ? (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mt-2"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  navigate("/");
                }}
                className="w-full text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 mt-2"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
