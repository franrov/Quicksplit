import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle2,
  CircleDashed,
  Home as HomeIcon,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../api";

export function HomeScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isEmptyState, setIsEmptyState] = useState(false);
  const [splits, setSplits] = useState<any[]>([]);
  const [balanceSplits, setBalanceSplits] = useState<any[]>([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(true);
  const [splitsError, setSplitsError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [splitInvite, setSplitInvite] = useState<any | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "QS";
  const balances = balanceSplits.reduce(
    (totals, split) => {
      const participants = Array.isArray(split.participants) ? split.participants : [];

      participants.forEach((participant: any) => {
        if (participant.status !== "pending") return;

        if (Number(participant.userId) === Number(currentUser?.id) && Number(split.user_id) !== Number(currentUser?.id)) {
          totals.youOwe += Number(participant.amount) || 0;
        } else if (Number(split.user_id) === Number(currentUser?.id) && Number(participant.userId) !== Number(currentUser?.id)) {
          totals.youAreOwed += Number(participant.amount) || 0;
        }
      });

      return totals;
    },
    { youOwe: 0, youAreOwed: 0 }
  );
  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    Promise.all([
      axios.get(apiUrl(`/splits?userId=${currentUser.id}&recurring=0`)),
      axios.get(apiUrl(`/splits?userId=${currentUser.id}&recurring=1`)),
    ])
      .then(([regularResponse, recurringResponse]) => {
        setSplits(regularResponse.data);
        setBalanceSplits([...regularResponse.data, ...recurringResponse.data]);
        setSplitsError("");
      })
      .catch((error) => {
        console.error("Error loading splits:", error);
        setSplitsError("Start the backend with npm run server");
      })
      .finally(() => {
        setIsLoadingSplits(false);
      });

    axios
      .get(apiUrl(`/notifications/unread-count?userId=${currentUser.id}`))
      .then((response) => {
        setUnreadNotificationCount(response.data.count || 0);
      })
      .catch((error) => {
        console.error("Error loading notification count:", error);
      });

    axios
      .get(apiUrl(`/notifications?userId=${currentUser.id}`))
      .then((response) => {
        const invite = response.data.find((notification: any) => notification.type === "invite" && !notification.is_read);
        setSplitInvite(invite || null);
      })
      .catch((error) => {
        console.error("Error loading split invites:", error);
      });
  }, [currentUser?.id, navigate]);

  const refreshHomeData = async () => {
    if (!currentUser?.id) return;

    const [regularResponse, recurringResponse, countResponse, notificationsResponse] = await Promise.all([
      axios.get(apiUrl(`/splits?userId=${currentUser.id}&recurring=0`)),
      axios.get(apiUrl(`/splits?userId=${currentUser.id}&recurring=1`)),
      axios.get(apiUrl(`/notifications/unread-count?userId=${currentUser.id}`)),
      axios.get(apiUrl(`/notifications?userId=${currentUser.id}`)),
    ]);

    setSplits(regularResponse.data);
    setBalanceSplits([...regularResponse.data, ...recurringResponse.data]);
    setUnreadNotificationCount(countResponse.data.count || 0);
    setSplitInvite(
      notificationsResponse.data.find((notification: any) => notification.type === "invite" && !notification.is_read) || null
    );
  };

  const handleInviteResponse = async (response: "accepted" | "rejected") => {
    if (!currentUser?.id || !splitInvite?.split_id) return;

    try {
      await axios.post(apiUrl(`/splits/${splitInvite.split_id}/respond`), {
        userId: currentUser.id,
        response,
      });
      toast.success(response === "accepted" ? "Split accepted" : "Split rejected");
      setSplitInvite(null);
      await refreshHomeData();
    } catch (error) {
      console.error("Error responding to invite:", error);
      toast.error("Could not respond to split invite");
    }
  };

  const handleDeleteSplit = async (splitId: number) => {
    if (!currentUser?.id) return;

    const shouldDelete = window.confirm("Delete this split?");
    if (!shouldDelete) return;

    try {
      await axios.delete(apiUrl(`/splits/${splitId}?userId=${currentUser.id}`));
      setSplits((currentSplits) => currentSplits.filter((split) => split.id !== splitId));
      toast.success("Split deleted");
    } catch (error) {
      console.error("Error deleting split:", error);
      toast.error("Could not delete split");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {splitInvite && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center px-6">
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4">
              <Receipt size={28} />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Split Invite
            </p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">{splitInvite.split_title}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-5">
              You were added to this split for{" "}
              <span className="font-black text-gray-900 dark:text-gray-50">
                ${Number(splitInvite.amount || 0).toFixed(2)}
              </span>
              . Accept to join it, or reject and the creator will cover your share.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleInviteResponse("rejected")}
                className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 font-black active:scale-[0.98] transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleInviteResponse("accepted")}
                className="rounded-2xl p-4 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950 font-black active:scale-[0.98] transition-all"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top action bar with notification + profile */}
      <div className="flex items-center justify-end gap-2 px-6 pt-4 pb-2">
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 active:bg-gray-50 transition-colors"
        >
          <Bell size={18} />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          )}
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-sm active:bg-gray-700 transition-colors"
        >
          <span className="text-xs font-black">{initials}</span>
        </button>
      </div>

      <div className="p-6 pt-2 space-y-6 flex flex-col flex-1">
        {isEmptyState ? (
          <>
            <div className="flex gap-4">
              <div className="flex-1 bg-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t("youOwe")}</p>
                <p className="text-2xl font-black text-gray-400">$0.00</p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{t("youAreOwed")}</p>
                <p className="text-2xl font-black text-gray-400">$0.00</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-6">
                <Receipt size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{t("noSplitsYet")}</h2>
              <p className="text-gray-500 font-medium mb-8 max-w-[250px]">
                {t("noSplitsYetBody")}
              </p>
              <button
                onClick={() => navigate("/new")}
                className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all"
              >
                <Plus size={24} />
                {t("createFirstSplit")}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Balances */}
            <div className="flex gap-4">
              <div className="flex-1 bg-red-50/80 rounded-2xl p-4 border border-red-100/50 shadow-sm">
                <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wider">{t("youOwe")}</p>
                <p className="text-2xl font-black text-red-700">${balances.youOwe.toFixed(2)}</p>
              </div>
              <div className="flex-1 bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100/50 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">{t("youAreOwed")}</p>
                <p className="text-2xl font-black text-emerald-700">${balances.youAreOwed.toFixed(2)}</p>
              </div>
            </div>

            {/* Primary Action */}
            <button
              onClick={() => navigate("/new")}
              className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all"
            >
              <Plus size={24} />
              {t("newSplit")}
            </button>

            {/* Shortcut */}
            <button
              onClick={() => navigate("/household")}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <HomeIcon size={24} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-gray-900">{t("householdExpenses")}</h3>
                <p className="text-sm text-gray-500 font-medium">{t("viewRecurringBills")}</p>
              </div>
            </button>

            {/* Recent Splits */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-gray-900">{t("recentSplits")}</h2>
                <button className="text-sm font-bold text-blue-600">{t("seeAll")}</button>
              </div>
              <div className="space-y-3">
                {isLoadingSplits ? (
                  <div className="text-center text-gray-500 py-4">
                    {t("loadingSplits")}
                  </div>
                ) : splitsError ? (
                  <div className="text-center text-orange-600 font-medium py-4">
                    {splitsError}
                  </div>
                ) : splits.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    {t("noSplitsFound")}
                  </div>
                ) : (
                  splits.map((split) => (
                    <SplitCard
                      key={split.id}
                      title={split.title}
                      amount={`$${Number(split.amount).toFixed(2)}`}
                      status={split.status}
                      settled={String(split.status).toLowerCase() === "settled"}
                      onClick={() => navigate(`/split/${split.id}`)}
                      onDelete={() => handleDeleteSplit(split.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Dev Toggle */}
        <button
          onClick={() => setIsEmptyState(!isEmptyState)}
          className="mt-auto pt-2 text-xs font-bold text-gray-300 uppercase tracking-widest text-center w-full"
        >
          {isEmptyState ? t("togglePopulatedState") : t("toggleEmptyState")}
        </button>
      </div>
    </div>
  );
}

function SplitCard({ title, amount, status, settled, onClick, onDelete }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
          settled ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Receipt size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <div className="flex items-center gap-1.5 mt-1">
          {settled ? (
            <CheckCircle2 size={14} className="text-gray-400" />
          ) : (
            <CircleDashed size={14} className="text-orange-500" />
          )}
          <p className={`text-sm ${settled ? "text-gray-500" : "text-orange-600 font-medium"}`}>
            {status}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="font-black text-gray-900">{amount}</div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
          aria-label={`Delete ${title}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
