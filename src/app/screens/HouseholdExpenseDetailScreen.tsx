import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, CalendarDays, CheckCircle2, Receipt, Repeat } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiUrl } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Participant = {
  id: string;
  userId?: number;
  name: string;
  status: string;
  amount: number;
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

export function HouseholdExpenseDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language, t } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [split, setSplit] = useState<Split | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get(apiUrl(`/splits/${id}?userId=${currentUser.id}`))
      .then((response) => {
        setSplit(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error loading household split:", error);
        setErrorMessage(language === "es" ? "No se pudo cargar este split." : "Could not load this split.");
      })
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, id, language, navigate]);

  const participants = split?.participants || [];
  const pendingCount = participants.filter((participant) => participant.status !== "paid").length;
  const isCreator = Number(split?.user_id) === Number(currentUser?.id);
  const myParticipant = participants.find((participant) => Number(participant.userId) === Number(currentUser?.id));
  const canMarkPaid = !isCreator && myParticipant?.status !== "paid";

  const handleMarkPaid = async () => {
    if (!split || !currentUser?.id) return;

    try {
      const response = await axios.patch(apiUrl(`/splits/${split.id}/pay`), {
        userId: currentUser.id,
      });
      setSplit(response.data);
      toast.success(language === "es" ? "Pago marcado como enviado" : "Payment marked as sent", { duration: 2000 });
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error(language === "es" ? "No se pudo marcar como pagado" : "Could not mark payment");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
        <p className="text-gray-500 dark:text-gray-400 font-bold">{t("loadingSplits")}</p>
      </div>
    );
  }

  if (errorMessage || !split) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
        <p className="text-gray-900 dark:text-gray-50 font-black text-xl mb-2">
          {language === "es" ? "Split no encontrado" : "Split not found"}
        </p>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate("/household")}
          className="w-full bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950 rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all"
        >
          {language === "es" ? "Volver" : "Back"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mb-5 text-blue-600 dark:text-blue-300">
          <Receipt size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">{split.title}</h2>
        <p className="text-5xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          ${Number(split.amount).toFixed(2)}
        </p>
        <div
          className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold border ${
            pendingCount === 0
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50"
              : "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900/50"
          }`}
        >
          {pendingCount === 0
            ? language === "es"
              ? "Saldado"
              : "Settled"
            : language === "es"
              ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`
              : `${pendingCount} pending ${pendingCount === 1 ? "payment" : "payments"}`}
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <Repeat size={16} />
            <span className="capitalize">{split.frequency?.replace("-", " ") || "monthly"}</span>
          </div>
          {split.next_due_date && (
            <div className="flex items-center justify-center gap-2">
              <CalendarDays size={16} />
              <span>
                {language === "es" ? "Próximo pago" : "Next due"}: {split.next_due_date}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg">
            {language === "es" ? "Participantes" : "Participants"}
          </h3>
        </div>
        <div className="space-y-3">
          {participants.map((participant) => {
            const isPaid = participant.status === "paid";
            const isMe = Number(participant.userId) === Number(currentUser?.id);

            return (
              <div
                key={participant.id}
                className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                      isPaid
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {participant.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-50 text-lg truncate">
                      {isMe ? language === "es" ? "Tú" : "You" : participant.name.replace(" (You)", "")}
                    </p>
                    <p
                      className={`text-sm font-bold capitalize ${
                        isPaid ? "text-emerald-600 dark:text-emerald-300" : "text-orange-500 dark:text-orange-300"
                      }`}
                    >
                      {participant.status}
                    </p>
                  </div>
                </div>
                <span className="font-black text-gray-900 dark:text-gray-50 text-lg shrink-0">
                  ${Number(participant.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-auto flex gap-4">
        {isCreator ? (
          <button
            onClick={() => navigate(`/split/${split.id}/remind`)}
            disabled={pendingCount === 0}
            className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 disabled:text-gray-300 dark:disabled:text-gray-700 text-gray-900 dark:text-gray-50 rounded-2xl p-4 font-bold text-lg shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            <Bell size={20} />
            {language === "es" ? "Recordar" : "Remind"}
          </button>
        ) : (
          <button
            onClick={handleMarkPaid}
            disabled={!canMarkPaid}
            className="w-full bg-emerald-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            <CheckCircle2 size={20} />
            {language === "es" ? "Marcar Pagado" : "Mark Paid"}
          </button>
        )}
      </div>
    </div>
  );
}
