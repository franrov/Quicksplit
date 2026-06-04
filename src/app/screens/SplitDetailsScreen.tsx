import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, CheckCircle2, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiUrl } from "../api";
import { updateStoredWalletBalance } from "../wallet";

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
  creator_name?: string;
  payer_user_id?: number;
  payer_name?: string;
  title: string;
  amount: number;
  status: string;
  participants: Participant[];
};

export function SplitDetailsScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [split, setSplit] = useState<Split | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isConfirmPayOpen, setIsConfirmPayOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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

  const splitStatus = String(split?.status || "").toLowerCase();
  const isSettled = splitStatus === "settled";
  const pendingCount = participants.filter((participant) => participant.status !== "paid").length;
  const isCreator = Number(split?.user_id) === Number(currentUser?.id);
  const isPaymentOwner = Number(split?.payer_user_id || split?.user_id) === Number(currentUser?.id);
  const myParticipant = participants.find((participant) => Number(participant.userId) === Number(currentUser?.id));
  const canMarkPaid = !isPaymentOwner && myParticipant?.status !== "paid";
  const canDelete = isCreator || isSettled;
  const creatorLabel = isCreator ? "Created by you" : `Created by ${split?.creator_name || "a friend"}`;
  const paymentAmount = Number(myParticipant?.amount || 0);
  const walletBalance = Number(currentUser?.wallet_balance ?? 1000);

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

    setIsPaying(true);

    try {
      const response = await axios.patch(apiUrl(`/splits/${split.id}/pay`), {
        userId: currentUser.id,
      });

      setSplit(response.data);
      updateStoredWalletBalance(response.data.wallet_balance);
      setIsConfirmPayOpen(false);
      toast.success("Payment marked as sent", { duration: 2000 });
    } catch (error: any) {
      console.error("Error marking paid:", error);
      toast.error(error.response?.data?.message || "Could not mark payment");
      if (error.response?.status === 402) {
        setIsConfirmPayOpen(false);
        navigate("/wallet/deposit");
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!split || !currentUser?.id) return;

    const shouldDelete = window.confirm("Delete this split? This cannot be undone.");
    if (!shouldDelete) return;

    try {
      await axios.delete(apiUrl(`/splits/${split.id}?userId=${currentUser.id}`));
      toast.success("Split deleted");
      navigate("/home", { replace: true });
    } catch (error: any) {
      console.error("Error deleting split:", error);
      toast.error(error.response?.data?.message || "Could not delete split");
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
      {isConfirmPayOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="w-full max-w-[360px] bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Confirm payment
            </p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-3">Mark as paid?</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-5">
              This will subtract{" "}
              <span className="font-black text-gray-900 dark:text-gray-50">${paymentAmount.toFixed(2)}</span>{" "}
              from your wallet balance and resolve your payment for {split.title}.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Balance</p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-50">${walletBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Paying</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">${paymentAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsConfirmPayOpen(false)}
                disabled={isPaying}
                className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 disabled:text-gray-400 text-gray-900 dark:text-gray-50 font-black active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={isPaying}
                className="rounded-2xl p-4 bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black active:scale-[0.98] transition-all"
              >
                {isPaying ? "Paying..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 text-emerald-600">
          <Receipt size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-2">{split.title}</h2>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">{creatorLabel}</p>
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
        {isPaymentOwner ? (
          <>
            <button
              onClick={() => navigate(`/split/${split.id}/remind`)}
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
            onClick={() => setIsConfirmPayOpen(true)}
            disabled={!canMarkPaid || isPaying}
            className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] disabled:shadow-none active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Mark as Paid
          </button>
        )}
      </div>
      {canDelete && (
        <div className="grid gap-3 pt-5 pb-4 grid-cols-1">
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white rounded-2xl p-4 font-bold shadow-[0_8px_24px_rgb(239,68,68,0.25)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <Trash2 size={20} />
              Delete
            </button>
        </div>
      )}
    </div>
  );
}
