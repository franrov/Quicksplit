import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../api";

type Notification = {
  id: number;
  split_id: number;
  is_recurring?: boolean;
  type: "balance" | "invite" | "payer_invite" | "reminder" | "paid";
  participant_id: string;
  participant_name: string;
  amount: number;
  split_title: string;
  message?: string;
  tone?: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "reminder">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");

  const loadNotifications = () => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    setIsLoading(true);

    axios
      .get(apiUrl(`/notifications?userId=${currentUser.id}`))
      .then((response) => {
        setNotifications(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error loading notifications:", error);
        setErrorMessage("Start the backend with npm run server");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id]);

  const handleOpenNotification = async (notification: Notification) => {
    if (!currentUser?.id) return;

    if (notification.type === "invite" || notification.type === "payer_invite") {
      navigate("/home");
      return;
    }

    try {
      if (!notification.is_read) {
        await axios.patch(apiUrl(`/notifications/${notification.id}/read`), {
          userId: currentUser.id,
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      navigate(notification.is_recurring ? `/household/${notification.split_id}` : `/split/${notification.split_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?.id) return;

    try {
      await axios.patch(apiUrl("/notifications/read-all"), {
        userId: currentUser.id,
      });
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    if (!currentUser?.id) return;

    try {
      await axios.delete(apiUrl(`/notifications/${notification.id}?userId=${currentUser.id}`));
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      toast.success(language === "es" ? "Notificación eliminada" : "Notification deleted");
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(error.response?.data?.message || (language === "es" ? "No se pudo eliminar" : "Could not delete notification"));
    }
  };

  const visibleNotifications =
    filter === "all" ? notifications : notifications.filter((notification) => notification.type === "reminder");
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const emptyTitle = filter === "all" ? t("noNotifications") : t("noReminders");
  const emptyBody = filter === "all" ? t("noNotificationsBody") : t("noRemindersBody");

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            {t("all")}
          </FilterButton>
          <FilterButton active={filter === "reminder"} onClick={() => setFilter("reminder")}>
            {t("reminders")}
          </FilterButton>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-black text-blue-600 dark:text-blue-300"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <EmptyState title={t("loadingNotifications")} body="" />
        ) : errorMessage ? (
          <EmptyState title={errorMessage} body="" />
        ) : visibleNotifications.length === 0 ? (
          <EmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              {t("today")}
            </p>
            <div className="space-y-2">
              {visibleNotifications.map((notification) => (
                <NotifCard
                  key={notification.id}
                  language={language}
                  notif={notification}
                  onPress={() => handleOpenNotification(notification)}
                  onDelete={() => handleDeleteNotification(notification)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
        active
          ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950"
          : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-4">
        <CheckCircle2 size={30} strokeWidth={1.7} />
      </div>
      <p className="text-lg font-black text-gray-900 dark:text-gray-50">{title}</p>
      {body && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 max-w-[220px]">{body}</p>}
    </div>
  );
}

function NotifCard({
  notif,
  language,
  onPress,
  onDelete,
}: {
  notif: Notification;
  language: "en" | "es";
  onPress: () => void;
  onDelete: () => void;
}) {
  const isPaid = notif.type === "paid";
  const isInvite = notif.type === "invite";
  const isPayerInvite = notif.type === "payer_invite";
  const isReminderMessage = notif.type === "reminder";
  const amount = Number(notif.amount || 0).toFixed(2);
  const isCurrentUser = notif.participant_id === "me";
  const title =
    isPayerInvite
      ? language === "es"
        ? `Solicitud de pago: ${notif.split_title}`
        : `Payment request: ${notif.split_title}`
      : isInvite
      ? language === "es"
        ? `Invitación: ${notif.split_title}`
        : `Split invite: ${notif.split_title}`
      : isReminderMessage
      ? language === "es"
        ? `Recordatorio: ${notif.split_title}`
        : `Reminder: ${notif.split_title}`
      : language === "es"
        ? isPaid
          ? `${notif.participant_name} pagó $${amount}`
          : isCurrentUser
            ? `Debes $${amount}`
            : `${notif.participant_name} te debe $${amount}`
        : isPaid
          ? `${notif.participant_name} paid $${amount}`
          : isCurrentUser
            ? `You owe $${amount}`
            : `${notif.participant_name} owes you $${amount}`;
  const subtitle =
    isPayerInvite
      ? language === "es"
        ? `Monto a pagar: $${amount}. Responde desde inicio.`
        : `Amount to fund: $${amount}. Respond from Home.`
      : isInvite
      ? language === "es"
        ? `Tu parte: $${amount}. Responde desde inicio.`
        : `Your share: $${amount}. Respond from Home.`
      : isReminderMessage
      ? notif.message || (language === "es" ? "Mensaje de recordatorio" : "Reminder message")
      : language === "es"
        ? isPaid
          ? `"${notif.split_title}" · Pago recibido`
          : `"${notif.split_title}" · Pendiente`
        : isPaid
          ? `"${notif.split_title}" · Payment received`
          : `"${notif.split_title}" · Pending`;

  return (
    <div
      onClick={onPress}
      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${
        notif.is_read
          ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/40 shadow-sm"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isPaid
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300"
            : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300"
        }`}
      >
        {isPaid ? <CheckCircle2 size={20} /> : <Clock size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${notif.is_read ? "text-gray-700 dark:text-gray-200" : "text-gray-900 dark:text-gray-50"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{language === "es" ? "Hoy" : "Today"}</p>
        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all"
          aria-label={language === "es" ? "Eliminar notificación" : "Delete notification"}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
