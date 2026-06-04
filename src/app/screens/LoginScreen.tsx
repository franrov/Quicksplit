import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../api";
import quicksplitLogo from "../assets/quicksplit-logo.svg";

export function LoginScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(apiUrl("/auth/login"), {
        email,
        password,
      });

      localStorage.setItem("quicksplitUser", JSON.stringify(response.data));
      navigate("/home", { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No account found. Please sign up first.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="flex-1 flex flex-col justify-center">
        <img
          src={quicksplitLogo}
          alt="QuickSplit"
          className="w-24 h-24 rounded-[1.75rem] shadow-lg mb-6 object-cover"
        />
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{t("welcomeBack")}</h2>
        <p className="text-gray-500 font-medium mb-8">{t("loginSubtitle")}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("password")}</label>
            <div className="relative">
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 pr-14 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-4 space-y-3">
        <button
          onClick={handleLogin}
          disabled={!email || !password || isSubmitting}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <LogIn size={22} />
          {isSubmitting ? t("loggingIn") : t("login")}
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-white text-gray-900 border border-gray-100 rounded-2xl p-4 font-bold text-lg shadow-sm active:bg-gray-50 transition-all"
        >
          {t("signUp")}
        </button>
      </div>
    </div>
  );
}
