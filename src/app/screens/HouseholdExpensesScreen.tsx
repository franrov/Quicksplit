import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, CircleDashed, Plus, Receipt } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Participant = {
  id: string;
  userId?: number;
  name: string;
  amount: number;
  status: string;
};

type Split = {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  status: string;
  frequency?: string;
  next_due_date?: string;
  participants: Participant[];
};

export function HouseholdExpensesScreen() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get(apiUrl(`/splits?userId=${currentUser.id}&recurring=1`))
      .then((response) => {
        setSplits(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error loading recurring splits:", error);
        setErrorMessage(language === "es" ? "No se pudieron cargar los gastos." : "Could not load expenses.");
      })
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, language, navigate]);

  const balances = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; type: "owed" | "owes" }>();

    splits.forEach((split) => {
      const participants = Array.isArray(split.participants) ? split.participants : [];
      if (String(split.status).toLowerCase() === "suspended") return;

      participants.forEach((participant) => {
        if (participant.status === "paid") return;

        const isCurrentUser = Number(participant.userId) === Number(currentUser?.id);
        const isCreator = Number(split.user_id) === Number(currentUser?.id);
        if (isCurrentUser && !isCreator) {
          const key = `owe-${split.user_id}`;
          const existing = totals.get(key) || {
            name: language === "es" ? "Tú" : "You",
            amount: 0,
            type: "owes" as const,
          };
          existing.amount += Number(participant.amount) || 0;
          totals.set(key, existing);
        } else if (isCreator && !isCurrentUser && participant.userId) {
          const key = `owed-${participant.userId}`;
          const existing = totals.get(key) || {
            name: participant.name.replace(" (You)", ""),
            amount: 0,
            type: "owed" as const,
          };
          existing.amount += Number(participant.amount) || 0;
          totals.set(key, existing);
        }
      });
    });

    return Array.from(totals.values()).filter((balance) => balance.amount > 0);
  }, [currentUser?.id, language, splits]);

  return (
    <div className="p-6 space-y-8 pb-12 flex flex-col min-h-full">
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            {language === "es" ? "Balance Recurrente" : "Recurring Balance"}
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
          {balances.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 font-bold py-4">
              {language === "es" ? "No hay balances pendientes." : "No pending balances."}
            </p>
          ) : (
            balances.map((balance, index) => (
              <div
                key={`${balance.type}-${balance.name}`}
                className={`flex items-center justify-between gap-3 ${
                  index !== balances.length - 1 ? "pb-5 border-b border-gray-50 dark:border-gray-800" : ""
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg font-black text-gray-600 dark:text-gray-300 shrink-0">
                    {balance.name.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-50 text-lg truncate">{balance.name}</span>
                </div>
                <div
                  className={`font-black text-lg shrink-0 ${
                    balance.type === "owed" ? "text-emerald-600" : "text-orange-500"
                  }`}
                >
                  <span className="text-sm font-bold opacity-80 mr-1.5">
                    {balance.type === "owed"
                      ? language === "es"
                        ? "debe"
                        : "owes"
                      : language === "es"
                        ? "debes"
                        : "you owe"}
                  </span>
                  ${balance.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="flex-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            {t("householdExpenses")}
          </h2>
          <button
            onClick={() => navigate("/household/new")}
            className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-full"
          >
            <Plus size={16} strokeWidth={3} />
            {language === "es" ? "Agregar" : "Add"}
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 font-bold py-8">{t("loadingSplits")}</p>
          ) : errorMessage ? (
            <p className="text-center text-orange-600 font-bold py-8">{errorMessage}</p>
          ) : splits.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 font-bold py-8">{t("noSplitsFound")}</p>
          ) : (
            splits.map((split) => {
              const settled = String(split.status).toLowerCase() === "settled";
              const suspended = String(split.status).toLowerCase() === "suspended";

              return (
                <div
                  key={split.id}
                  onClick={() => navigate(`/household/${split.id}`)}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                      settled
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        : suspended
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300"
                    }`}
                  >
                    <Receipt size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-gray-50 text-lg truncate">{split.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {settled ? (
                        <CheckCircle2 size={16} className="text-gray-400" />
                      ) : suspended ? (
                        <CircleDashed size={16} className="text-gray-400" />
                      ) : (
                        <CircleDashed size={16} className="text-orange-500" />
                      )}
                      <p
                        className={`text-sm capitalize ${
                          settled || suspended ? "text-gray-500 font-bold" : "text-orange-600 font-bold"
                        }`}
                      >
                        {suspended ? (language === "es" ? "suspendido" : "suspended") : split.frequency ? split.frequency.replace("-", " ") : split.status}
                      </p>
                    </div>
                  </div>
                  <div className="font-black text-gray-900 dark:text-gray-50 text-xl shrink-0">
                    ${Number(split.amount).toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
