import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, CheckCircle2, Receipt } from "lucide-react";
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
  participants: Participant[];
};

export function SplitDetailsScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
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
        console.error("Error loading split:", error);
        setErrorMessage("Could not load this split");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser?.id, id, navigate]);

  const participants =
    split?.participants && split.participants.length > 0
      ? split.participants
      : [
          {
            id: "me",
            name: `${currentUser?.name || "You"} (You)`,
            status: split?.status || "pending",
            amount: split?.amount || 0,
          },
        ];

  const pendingCount = participants.filter((participant) => participant.status !== "paid").length;
  const isCreator = Number(split?.user_id) === Number(currentUser?.id);
  const myParticipant = participants.find((participant) => Number(participant.userId) === Number(currentUser?.id));
  const canMarkPaid = !isCreator && myParticipant?.status !== "paid";

  const handleRemind = async () => {
    if (!split || !currentUser?.id) return;

    try {
      const response = await axios.post(apiUrl(`/splits/${split.id}/reminders`), {
        userId: currentUser.id,
      });

      if (response.data.count === 0) {
        toast(t("noPendingRemindersToSend"), {
          icon: <Bell className="w-5 h-5 text-blue-500" />,
          duration: 2000,
        });
      } else {
        toast.success(t("remindersSent"), {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Could not send reminders");
    }
  };

  const handleSettle = async () => {
    if (!split || !currentUser?.id) return;

    try {
      const response = await axios.patch(apiUrl(`/splits/${split.id}/settle`), {
        userId: currentUser.id,
      });

      setSplit(response.data);
      toast.success("Split marked as settled", { duration: 2000 });
    } catch (error) {
      console.error("Error settling split:", error);
      toast.error("Could not settle split");
    }
  };

  const handleMarkPaid = async () => {
    if (!split || !currentUser?.id) return;

    try {
      const response = await axios.patch(apiUrl(`/splits/${split.id}/pay`), {
        userId: currentUser.id,
      });

      setSplit(response.data);
      toast.success("Payment marked as sent", { duration: 2000 });
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error("Could not mark payment");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
        <p className="text-gray-500 font-bold">Loading split...</p>
      </div>
    );
  }

  if (errorMessage || !split) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
        <p className="text-gray-900 font-black text-xl mb-2">Split not found</p>
        <p className="text-gray-500 font-medium mb-6">{errorMessage || "This split does not exist."}</p>
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 text-emerald-600">
          <Receipt size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-2">{split.title}</h2>
        <p className="text-5xl font-black text-gray-900 tracking-tight">${Number(split.amount).toFixed(2)}</p>
        <div
          className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold border ${
            pendingCount === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-orange-50 text-orange-700 border-orange-100"
          }`}
        >
          {pendingCount === 0 ? "Settled" : `${pendingCount} pending ${pendingCount === 1 ? "payment" : "payments"}`}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <h3 className="font-bold text-gray-900 px-2 text-lg">Participants</h3>
        <div className="space-y-3">
          {participants.map((participant) => {
            const isPaid = participant.status === "paid";

            return (
              <div
                key={participant.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                      isPaid ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {participant.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-lg truncate">{participant.name}</p>
                    <p className={`text-sm font-bold capitalize ${isPaid ? "text-emerald-600" : "text-orange-500"}`}>
                      {participant.status}
                    </p>
                  </div>
                </div>
                <span className="font-black text-gray-900 text-lg shrink-0">
                  ${Number(participant.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8 pb-4 mt-auto flex gap-4">
        {isCreator ? (
          <>
            <button
              onClick={handleRemind}
              disabled={pendingCount === 0}
              className="flex-1 bg-white border-2 border-gray-200 disabled:text-gray-300 text-gray-900 rounded-2xl p-4 font-bold text-lg shadow-sm active:bg-gray-50 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <Bell size={20} />
              Remind
            </button>
            <button
              onClick={handleSettle}
              disabled={pendingCount === 0}
              className="flex-1 bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <CheckCircle2 size={20} />
              Settle All
            </button>
          </>
        ) : (
          <button
            onClick={handleMarkPaid}
            disabled={!canMarkPaid}
            className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Mark Paid
          </button>
        )}
      </div>
    </div>
  );
}
