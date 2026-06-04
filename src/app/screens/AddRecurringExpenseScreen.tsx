import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, Check, Repeat, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiUrl } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { updateStoredWalletBalance } from "../wallet";

type AppUser = {
  id: number;
  name: string;
  email: string;
};

type Frequency = "weekly" | "bi-weekly" | "monthly";

const today = new Date().toISOString().slice(0, 10);

export function AddRecurringExpenseScreen() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(today);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get(apiUrl(`/users?userId=${currentUser.id}`))
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error("Error loading users:", error);
        toast.error(language === "es" ? "No se pudieron cargar usuarios" : "Could not load users");
      })
      .finally(() => setIsLoadingUsers(false));
  }, [currentUser?.id, language, navigate]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.id)),
    [selectedUserIds, users]
  );

  const perPersonAmount = selectedUsers.length >= 0 ? (Number(amount) || 0) / (selectedUsers.length + 1) : 0;

  const toggleUser = (userId: number) => {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const handleCreate = async () => {
    if (!currentUser?.id || !title.trim() || !Number(amount) || selectedUsers.length === 0) return;

    const participants = [
      {
        id: "me",
        userId: currentUser.id,
        name: `${currentUser.name || "You"} (You)`,
        amount: Number(perPersonAmount.toFixed(2)),
        status: "paid",
      },
      ...selectedUsers.map((user) => ({
        id: `user-${user.id}`,
        userId: user.id,
        name: user.name,
        amount: Number(perPersonAmount.toFixed(2)),
        status: "pending",
      })),
    ];

    setIsCreating(true);

    try {
      const response = await axios.post(apiUrl("/splits"), {
        userId: currentUser.id,
        title: title.trim(),
        amount: Number(amount),
        status: "pending",
        method: "equal",
        payer: "me",
        isRecurring: true,
        frequency,
        nextDueDate,
        participants,
      });

      updateStoredWalletBalance(response.data.wallet_balance);
      toast.success(language === "es" ? "Split recurrente creado" : "Recurring split created");
      navigate(`/household/${response.data.id}`);
    } catch (error: any) {
      console.error("Error creating recurring split:", error);
      toast.error(error.response?.data?.message || (language === "es" ? "No se pudo crear" : "Could not create recurring split"));
      if (error.response?.status === 402) {
        navigate("/wallet/deposit");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          {language === "es" ? "Nuevo split recurrente" : "New recurring split"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
          {language === "es"
            ? "Crea un split que se repite cada semana, dos semanas o mes."
            : "Create a split that repeats weekly, bi-weekly, or monthly."}
        </p>
      </div>

      <div className="space-y-5 flex-1">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Nombre" : "Name"}
          </label>
          <input
            type="text"
            placeholder={language === "es" ? "Ej. Renta, Internet, Spotify" : "e.g. Rent, Internet, Spotify"}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 text-gray-900 dark:text-gray-50 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-50 transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Monto" : "Amount"}
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-9 pr-4 py-4 text-gray-900 dark:text-gray-50 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-50 transition-all shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Frecuencia" : "Frequency"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Repeat size={20} />
            </span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency)}
              className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-11 pr-4 py-4 text-gray-900 dark:text-gray-50 font-bold focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-50 transition-all shadow-sm appearance-none"
            >
              <option value="weekly">{language === "es" ? "Semanal" : "Weekly"}</option>
              <option value="bi-weekly">{language === "es" ? "Cada dos semanas" : "Bi-weekly"}</option>
              <option value="monthly">{language === "es" ? "Mensual" : "Monthly"}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Próxima fecha de pago" : "Next payment date"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <CalendarDays size={20} />
            </span>
            <input
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
              className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-11 pr-4 py-4 text-gray-900 dark:text-gray-50 font-bold focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 focus:border-gray-900 dark:focus:border-gray-50 transition-all shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {language === "es" ? "Personas" : "People"}
          </label>
          <div className="space-y-2">
            {isLoadingUsers ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4 font-medium">
                {language === "es" ? "Cargando..." : "Loading users..."}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4 font-medium">
                {language === "es" ? "Tu amigo debe crear una cuenta primero." : "Ask your friend to sign up first."}
              </div>
            ) : (
              users.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);

                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left border-2 transition-all ${
                      isSelected
                        ? "border-gray-900 dark:border-gray-50 bg-gray-900/5 dark:bg-gray-50/10"
                        : "border-transparent bg-white dark:bg-gray-900"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-50 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                    {isSelected && <Check size={18} className="text-gray-900 dark:text-gray-50" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="pt-6 pb-4 mt-auto">
        <button
          onClick={handleCreate}
          disabled={!title.trim() || !Number(amount) || selectedUsers.length === 0 || isCreating}
          className="w-full bg-gray-900 dark:bg-gray-50 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white dark:text-gray-950 rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          {isCreating
            ? language === "es"
              ? "Creando..."
              : "Creating..."
            : language === "es"
              ? "Crear split recurrente"
              : "Create recurring split"}
        </button>
      </div>
    </div>
  );
}
