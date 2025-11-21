import { FcGoogle } from "react-icons/fc";
import { SlSocialLinkedin } from "react-icons/sl";
import { useState } from "react";

export default function SocialLoginButtons() {
  const [loading, setLoading] = useState(false);

  const handleOAuth = (provider) => {
    setLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/${provider}`;
  };

  return (
    <div className="space-y-3 mt-4">
      {/* GOOGLE BUTTON */}
      <button
        onClick={() => handleOAuth("google")}
        className="w-full flex items-center justify-center gap-3
                   border border-gray-300 dark:border-gray-700 
                   py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                   transition text-gray-700 dark:text-gray-200"
      >
        <FcGoogle size={22} />
        <span>{loading ? "Redirecting..." : "Continue with Google"}</span>
      </button>

      {/* LINKEDIN BUTTON */}
      <button
        onClick={() => handleOAuth("linkedin")}
        className="w-full flex items-center justify-center gap-3 
                   bg-[#0a66c2] text-white py-2 rounded-lg 
                   hover:bg-[#004182] transition"
      >
        <SlSocialLinkedin size={20} />
        <span>{loading ? "Redirecting..." : "Continue with LinkedIn"}</span>
      </button>
    </div>
  );
}
