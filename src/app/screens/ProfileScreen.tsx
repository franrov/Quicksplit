import React from "react";
import { useNavigate } from "react-router";
import {
  User,
  CreditCard,
  Lock,
  Globe,
  Moon,
  ChevronRight,
  Plus,
  LogOut,
} from "lucide-react";

export function ProfileScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)] pb-8">

      {/* Avatar + user info */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-2xl font-black text-white">FR</span>
        </div>
        <h2 className="text-xl font-black text-gray-900">Francisca Rovira</h2>
        <p className="text-sm text-gray-500 font-medium mt-0.5">francisca.rovira@pr.edu</p>
        <p className="text-sm text-gray-400 font-medium">(787) 696-6767</p>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">

        {/* Payment Methods */}
        <Section title="Payment Method">
          <SettingsRow
            icon={<CreditCard size={18} />}
            iconBg="bg-blue-100 text-blue-600"
            label="ATH Móvil"
            value="Default"
          />
          <SettingsRow
            icon={<Plus size={18} />}
            iconBg="bg-gray-100 text-gray-500"
            label="Add payment method"
            onPress={() => navigate("/payment-method/new")}
            chevron
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <SettingsRow
            icon={<Lock size={18} />}
            iconBg="bg-amber-100 text-amber-600"
            label="Change password"
            onPress={() => {}}
            chevron
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingsRow
            icon={<Globe size={18} />}
            iconBg="bg-indigo-100 text-indigo-600"
            label="Language"
            value="English"
            onPress={() => {}}
            chevron
          />
          <SettingsRow
            icon={<Moon size={18} />}
            iconBg="bg-purple-100 text-purple-600"
            label="Theme"
            value="Light"
            onPress={() => {}}
            chevron
          />
        </Section>

        {/* Sign out */}
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 font-bold active:scale-[0.98] transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
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
      className={`flex items-center gap-3 px-4 py-3.5 ${onPress ? "cursor-pointer active:bg-gray-50 transition-colors" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <span className="flex-1 font-bold text-gray-800 text-sm">{label}</span>
      {value && <span className="text-sm text-gray-400 font-medium">{value}</span>}
      {chevron && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
    </div>
  );
}
