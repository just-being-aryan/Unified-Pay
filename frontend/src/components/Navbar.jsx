import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/useAuth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // === Scroll Listener ===
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4 transition-all">
      <nav
      className={`
        w-full max-w-7xl backdrop-blur-lg border shadow-lg 
        rounded-[999px] transition-all
        ${scrolled 
          ? "bg-white/95 dark:bg-gray-900/95 border-gray-300 dark:border-gray-700 shadow-xl scale-[0.98]"
          : "bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 scale-100"
        }
      `}
    >

        <div className={`transition-all px-6 ${scrolled ? "py-1" : "py-2"}`}>
          <div className="flex justify-between items-center h-14 md:h-16">

            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-bold text-black dark:text-white tracking-tight"
            >
              UniPay
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) =>
                link.name === "Payments" ? (
                  <button
                    key={link.name}
                    onClick={() => handleProtectedNav(link.path)}
                    className="text-gray-800 dark:text-gray-200 hover:text-blue-700 transition font-medium"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-gray-800 dark:text-gray-200 hover:text-blue-700 transition font-medium"
                  >
                    {link.name}
                  </Link>
                )
              )}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition"
                  >
                    Sign in
                  </Link>

                </>
              )}

              {user && (
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Logout
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-800 dark:text-gray-200"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-sm rounded-b-2xl">
            <div className="px-4 py-4 space-y-3">

              {navLinks.map((link) =>
                link.name === "Payments" ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      setIsOpen(false);
                      handleProtectedNav(link.path);
                    }}
                    className="block w-full text-left text-gray-800 dark:text-gray-200 hover:text-blue-700 transition font-medium"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-800 dark:text-gray-200 hover:text-blue-700 transition font-medium"
                  >
                    {link.name}
                  </Link>
                )
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition"
                  >
                    Register
                  </Link>
                </>
              )}

              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate("/");
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
