import { useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, Wallet } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { apiUrl } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { updateStoredWalletBalance } from "../wallet";

const presetAmounts = [25, 50, 100, 250, 500, 1000];

export function DepositFundsScreen() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [amount, setAmount] = useState("100");
  const [isDepositing, setIsDepositing] = useState(false);
  const walletBalance = Number(currentUser?.wallet_balance ?? 1000);

  const handleDeposit = async () => {
    const depositAmount = Number(amount);

    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    if (!depositAmount || depositAmount <= 0) {
      toast.error(language === "es" ? "Ingresa un monto válido" : "Enter a valid amount");
      return;
    }

    setIsDepositing(true);

    try {
      const response = await axios.post(apiUrl("/wallet/deposit"), {
        userId: currentUser.id,
        amount: depositAmount,
      });

      updateStoredWalletBalance(response.data.wallet_balance);
      toast.success(language === "es" ? "Fondos agregados" : "Funds added");
      navigate("/profile");
    } catch (error: any) {
      console.error("Error depositing funds:", error);
      toast.error(error.response?.data?.message || (language === "es" ? "No se pudo depositar" : "Could not deposit funds"));
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-5">
          <Wallet size={28} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
          {language === "es" ? "Balance disponible" : "Available balance"}
        </p>
        <p className="text-5xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          ${walletBalance.toFixed(2)}
        </p>
      </div>

      <div className="space-y-5 flex-1">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Monto a depositar" : "Deposit amount"}
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-9 pr-4 py-4 text-gray-900 dark:text-gray-50 font-black text-lg focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-50 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`rounded-2xl p-3 font-black border transition-all ${
                Number(amount) === preset
                  ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950 border-gray-900 dark:border-gray-50"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-800"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex gap-3">
          <CreditCard size={20} className="text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {language === "es"
              ? "Este depósito es dinero de prueba para usar en QuickSplit."
              : "This deposit is demo money you can use inside QuickSplit."}
          </p>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={isDepositing}
        className="w-full bg-gray-900 dark:bg-gray-50 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white dark:text-gray-950 rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
      >
        {isDepositing
          ? language === "es"
            ? "Depositando..."
            : "Depositing..."
          : language === "es"
            ? "Depositar fondos"
            : "Deposit funds"}
      </button>
    </div>
  );
}
