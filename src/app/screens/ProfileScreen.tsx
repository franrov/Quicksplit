import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CreditCard,
  Lock,
  Globe,
  Moon,
  ChevronRight,
  Plus,
  LogOut,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { language, t, toggleLanguage } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [theme, setTheme] = useState(localStorage.getItem("quicksplitTheme") || "light");
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "QS";

  const handleSignOut = () => {
    localStorage.removeItem("quicksplitUser");
    navigate("/", { replace: true });
  };

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("quicksplitTheme", theme);
  }, [theme]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)] pb-8">

      {/* Avatar + user info */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 rounded-full bg-gray-900 dark:bg-gray-50 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-2xl font-black text-white dark:text-gray-950">{initials}</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-50">{currentUser?.name || "QuickSplit User"}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{currentUser?.email || t("noEmail")}</p>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">

        {/* Payment Methods */}
        <Section title={t("paymentMethod")}>
          <SettingsRow
            icon={<CreditCard size={18} />}
            iconBg="bg-blue-100 text-blue-600"
            label="ATH Móvil"
            value="Default"
          />
          <SettingsRow
            icon={<Plus size={18} />}
            iconBg="bg-gray-100 text-gray-500"
            label={t("addPaymentMethod")}
            onPress={() => navigate("/payment-method/new")}
            chevron
          />
        </Section>

        {/* Security */}
        <Section title={t("security")}>
          <SettingsRow
            icon={<Lock size={18} />}
            iconBg="bg-amber-100 text-amber-600"
            label={t("changePassword")}
            onPress={() => navigate("/profile/change-password")}
            chevron
          />
        </Section>

        {/* Preferences */}
        <Section title={t("preferences")}>
          <SettingsRow
            icon={<Globe size={18} />}
            iconBg="bg-indigo-100 text-indigo-600"
            label={t("language")}
            value={language === "en" ? "English" : "Espanol"}
            onPress={toggleLanguage}
            chevron
          />
          <SettingsRow
            icon={<Moon size={18} />}
            iconBg="bg-purple-100 text-purple-600"
            label={t("theme")}
            value={theme === "dark" ? t("dark") : t("light")}
            onPress={handleToggleTheme}
            chevron
          />
        </Section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-500 dark:text-red-300 font-bold active:scale-[0.98] transition-all"
        >
          <LogOut size={18} />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
        {title}
      </p>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  value,
  onPress,
  chevron,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <div
      onClick={onPress}
      className={`flex items-center gap-3 px-4 py-3.5 ${onPress ? "cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <span className="flex-1 font-bold text-gray-800 dark:text-gray-100 text-sm">{label}</span>
      {value && <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{value}</span>}
      {chevron && <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />}
    </div>
  );
}
