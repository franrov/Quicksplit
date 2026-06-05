import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, Send } from "lucide-react";
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
  payer_user_id?: number;
  title: string;
  amount: number;
  participants: Participant[];
};

type Tone = "friendly" | "neutral" | "aggressive" | "custom";

const presets = {
  en: {
    friendly: "Hey! Just a friendly reminder whenever you get a chance.",
    neutral: "Reminder: your part of this split is still pending.",
    aggressive: "Please settle this split as soon as possible. It has been pending for too long.",
  },
  es: {
    friendly: "Hola! Recordatorio amistoso para cuando puedas.",
    neutral: "Recordatorio: tu parte de este split sigue pendiente.",
    aggressive: "Por favor salda este split lo antes posible. Lleva demasiado tiempo pendiente.",
  },
};

export function ReminderMessageScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [split, setSplit] = useState<Split | null>(null);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get(apiUrl(`/splits/${id}?userId=${currentUser.id}`))
      .then((response) => {
        setSplit(response.data);
        setMessage(presets[language].friendly);
      })
      .catch((error) => {
        console.error("Error loading split for reminder:", error);
        toast.error(language === "es" ? "No se pudo cargar este split" : "Could not load this split");
      })
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, id, language, navigate]);

  const recipients = useMemo(
    () =>
      (split?.participants || []).filter(
        (participant) =>
          participant.status === "pending" &&
          participant.userId &&
          Number(participant.userId) !== Number(split?.payer_user_id || split?.user_id)
      ),
    [split]
  );

  const selectPreset = (nextTone: Exclude<Tone, "custom">) => {
    setTone(nextTone);
    setMessage(presets[language][nextTone]);
  };

  const handleSend = async () => {
    if (!split || !currentUser?.id || !message.trim()) return;

    setIsSending(true);
    try {
      const response = await axios.post(apiUrl(`/splits/${split.id}/reminders`), {
        userId: currentUser.id,
        message: message.trim(),
        tone,
      });

      if (response.data.count === 0) {
        toast(language === "es" ? "No hay personas pendientes." : "No pending people to remind.");
      } else {
        toast.success(language === "es" ? "Recordatorio enviado" : "Reminder sent");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error(language === "es" ? "No se pudo enviar" : "Could not send reminder");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
        <p className="text-gray-500 dark:text-gray-400 font-bold">{language === "es" ? "Cargando..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)] flex flex-col">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Split</p>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-50">{split?.title}</h2>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
          {language === "es" ? "Se enviará a" : "Sending to"} {recipients.length}{" "}
          {language === "es" ? "persona(s)" : "person(s)"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["friendly", "neutral", "aggressive"] as const).map((option) => (
          <button
            key={option}
            onClick={() => selectPreset(option)}
            className={`rounded-2xl p-3 text-xs font-black capitalize border transition-all ${
              tone === option
                ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950 border-gray-900 dark:border-gray-50"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-800"
            }`}
          >
            {language === "es" ? (option === "friendly" ? "Amable" : option === "neutral" ? "Neutral" : "Firme") : option}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setTone("custom");
        }}
        className="w-full min-h-[170px] rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-gray-900 dark:text-gray-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder={language === "es" ? "Escribe tu mensaje..." : "Write your reminder message..."}
      />

      <div className="mt-4 space-y-2">
        {recipients.map((recipient) => (
          <div
            key={recipient.id}
            className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3"
          >
            <p className="font-bold text-gray-900 dark:text-gray-50 truncate">{recipient.name.replace(" (You)", "")}</p>
            <p className="font-black text-gray-900 dark:text-gray-50">${Number(recipient.amount).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSend}
        disabled={isSending || recipients.length === 0 || !message.trim()}
        className="mt-auto w-full bg-gray-900 dark:bg-gray-50 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white dark:text-gray-950 rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2"
      >
        {isSending ? <Bell size={20} /> : <Send size={20} />}
        {isSending ? (language === "es" ? "Enviando..." : "Sending...") : language === "es" ? "Enviar Recordatorio" : "Send Reminder"}
      </button>
    </div>
  );
}
