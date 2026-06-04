import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../api";

export function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = currentPassword && newPassword.length >= 6 && newPassword === confirmPassword && !isSubmitting;

  const handleChangePassword = async () => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.patch(apiUrl("/auth/change-password"), {
        userId: currentUser.id,
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-6">
          <KeyRound size={30} strokeWidth={1.8} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight mb-2">{t("changePassword")}</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
          Enter your current password, then choose a new one.
        </p>

        <div className="space-y-4">
          <PasswordInput
            label={t("currentPassword")}
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={t("currentPassword")}
          />
          <PasswordInput
            label={t("newPassword")}
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t("newPasswordHint")}
          />
          <PasswordInput
            label={t("confirmNewPassword")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t("repeatNewPassword")}
          />
        </div>
      </div>

      <div className="pt-8 pb-4">
        <button
          onClick={handleChangePassword}
          disabled={!canSubmit}
          className="w-full bg-gray-900 dark:bg-gray-50 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white dark:text-gray-950 rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          {isSubmitting ? t("saving") : t("savePassword")}
        </button>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 pr-14 text-gray-900 dark:text-gray-50 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-200 transition-all shadow-sm"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}
