import { useState } from "react";
import { useNavigate } from "react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../api";

export function SignupScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateSignup = () => {
    const nextErrors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      nextErrors.name = "The Name field is required";
    }

    if (!email.trim()) {
      nextErrors.email = "The Email field is required";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "The Password field is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (isSubmitting) return;

    if (!validateSignup()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(apiUrl("/auth/signup"), {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      localStorage.setItem("quicksplitUser", JSON.stringify(response.data));
      toast.success("Account created successfully!");
      navigate("/home", { replace: true });
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      }
      toast.error(error.response?.data?.message || "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{t("createAccount")}</h2>
        <p className="text-gray-500 font-medium mb-8">{t("signupSubtitle")}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("name")}</label>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              className={`w-full bg-white border-2 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm ${
                errors.name ? "border-red-300" : "border-gray-100"
              }`}
            />
            {errors.name && <p className="mt-2 text-sm font-bold text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("email")}</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className={`w-full bg-white border-2 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm ${
                errors.email ? "border-red-300" : "border-gray-100"
              }`}
            />
            {errors.email && <p className="mt-2 text-sm font-bold text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("password")}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Create a password"
              aria-invalid={Boolean(errors.password)}
              className={`w-full bg-white border-2 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm ${
                errors.password ? "border-red-300" : "border-gray-100"
              }`}
            />
            {errors.password && <p className="mt-2 text-sm font-bold text-red-500">{errors.password}</p>}
          </div>
        </div>
      </div>

      <div className="pt-8 pb-4 space-y-3">
        <button
          onClick={handleSignup}
          disabled={isSubmitting}
          className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <UserPlus size={22} />
          {isSubmitting ? t("creating") : t("createAccountAction")}
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full bg-white text-gray-900 border border-gray-100 rounded-2xl p-4 font-bold text-lg shadow-sm active:bg-gray-50 transition-all"
        >
          {t("backToLogin")}
        </button>
      </div>
    </div>
  );
}
