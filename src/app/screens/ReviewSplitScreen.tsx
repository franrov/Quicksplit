import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Check, CheckCircle, Edit2, Receipt, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiUrl } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { updateStoredWalletBalance } from "../wallet";

export function ReviewSplitScreen() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const [splitData, setSplitData] = useState(
    location.state || {
    title: "Unknown",
    amount: "0",
    people: [],
    method: "equal",
    assignedValues: {},
    payer: "me",
    }
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draftAmount, setDraftAmount] = useState(String(splitData.amount || "0"));
  const [draftMethod, setDraftMethod] = useState(splitData.method || "equal");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [draftSelectedUserIds, setDraftSelectedUserIds] = useState<number[]>(
    (splitData.people || []).map((person: any) => person.userId).filter(Boolean)
  );
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const totalAmount = parseFloat(splitData.amount) || 0;
  const participantIds = ["me", ...splitData.people.map((person: any) => person.id)];

  const getMethodLabel = () => {
    if (splitData.method === "fixed") return "Fixed amounts";
    if (splitData.method === "percentage") return "By percentage";
    return "Split equally";
  };

  const getPayerLabel = () => {
    if (splitData.payer === "other") return "Someone else paid upfront";
    if (splitData.payer === "multiple") return "Multiple people paid";
    return "You paid upfront";
  };

  const openEditModal = () => {
    setDraftAmount(String(splitData.amount || "0"));
    setDraftMethod(splitData.method || "equal");
    setDraftSelectedUserIds((splitData.people || []).map((person: any) => person.userId).filter(Boolean));
    setIsEditOpen(true);

    if (availableUsers.length === 0 && currentUser?.id) {
      setIsLoadingUsers(true);
      axios
        .get(apiUrl(`/users?userId=${currentUser.id}`))
        .then((response) => setAvailableUsers(response.data))
        .catch((error) => {
          console.error("Error loading users for quick edit:", error);
          toast.error("Could not load users");
        })
        .finally(() => setIsLoadingUsers(false));
    }
  };

  const buildAssignedValues = (amount: number, method: string, ids = participantIds) => {
    if (method === "percentage") {
      const equalPercentage = Number((100 / ids.length).toFixed(2));
      return Object.fromEntries(ids.map((id) => [id, equalPercentage]));
    }

    if (method === "fixed") {
      const equalAmount = Number((amount / ids.length).toFixed(2));
      return Object.fromEntries(ids.map((id) => [id, equalAmount]));
    }

    return {};
  };

  const toggleDraftUser = (userId: number) => {
    setDraftSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const handleApplyEdit = () => {
    const nextAmount = parseFloat(draftAmount);
    const nextPeople = availableUsers
      .filter((user) => draftSelectedUserIds.includes(user.id))
      .map((user) => ({
        id: `user-${user.id}`,
        userId: user.id,
        name: user.name,
        email: user.email,
      }));
    const nextParticipantIds = ["me", ...nextPeople.map((person: any) => person.id)];

    if (!nextAmount || nextAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (nextPeople.length === 0) {
      toast.error("Select at least one person");
      return;
    }

    setSplitData((current: any) => ({
      ...current,
      amount: nextAmount.toFixed(2),
      people: nextPeople,
      method: draftMethod,
      assignedValues: buildAssignedValues(nextAmount, draftMethod, nextParticipantIds),
    }));
    setIsEditOpen(false);
    toast.success("Review updated");
  };

  const handleCreate = async () => {
    if (!currentUser?.id) {
      toast.error("Please log in before creating a split");
      navigate("/", { replace: true });
      return;
    }

    const paidParticipantId =
      splitData.payer === "me"
        ? "me"
        : splitData.payer === "other"
          ? splitData.selectedPayer?.id || splitData.people[0]?.id || "me"
          : null;

    const participants = participantIds.map((id) => {
      const person = id === "me" ? { name: currentUser.name || "You" } : splitData.people.find((p: any) => p.id === id);
      let amount = 0;

      if (splitData.method === "equal") {
        amount = totalAmount / participantIds.length;
      } else if (splitData.method === "percentage") {
        const pct = parseFloat(splitData.assignedValues[id]) || 0;
        amount = totalAmount * (pct / 100);
      } else {
        amount = parseFloat(splitData.assignedValues[id]) || 0;
      }

      return {
        id,
        userId: id === "me" ? currentUser.id : person?.userId,
        name: id === "me" ? `${person.name} (You)` : person?.name || "Unknown",
        amount: Number(amount.toFixed(2)),
        status: splitData.payer === "multiple" || id === paidParticipantId ? "paid" : "pending",
      };
    });

    try {
      const response = await axios.post(apiUrl("/splits"), {
        userId: currentUser.id,
        title: splitData.title,
        amount: totalAmount,
        status: participants.some((participant) => participant.status === "pending") ? "pending" : "settled",
        method: splitData.method,
        payer: splitData.payer,
        payerUserId:
          splitData.payer === "other"
            ? splitData.selectedPayer?.userId
            : currentUser.id,
        payerName:
          splitData.payer === "other"
            ? splitData.selectedPayer?.name
            : currentUser.name,
        participants,
      });
      updateStoredWalletBalance(response.data.wallet_balance);
      const pendingParticipants = participants.filter((participant) => participant.status !== "paid");
      const peopleWhoOweYou = pendingParticipants.filter((participant) => participant.id !== "me");
      const youOwe = pendingParticipants.find((participant) => participant.id === "me");

      if (peopleWhoOweYou.length > 0) {
        const firstPerson = peopleWhoOweYou[0];
        const extraCount = peopleWhoOweYou.length - 1;

        toast.success(
          language === "es"
            ? `${firstPerson.name} te debe $${Number(firstPerson.amount).toFixed(2)}`
            : `${firstPerson.name} owes you $${Number(firstPerson.amount).toFixed(2)}`,
          {
            description:
              extraCount > 0
                ? language === "es"
                  ? `Y ${extraCount} más recibieron invitaciones.`
                  : `And ${extraCount} more received invites.`
                : language === "es"
                  ? "Invitación enviada."
                  : "Invite sent.",
            duration: 4000,
          }
        );
      } else if (youOwe) {
        toast(
          language === "es"
            ? `Debes $${Number(youOwe.amount).toFixed(2)}`
            : `You owe $${Number(youOwe.amount).toFixed(2)}`,
          {
            description:
              language === "es"
                ? "Se agregó a tus notificaciones."
                : "Added to your notifications.",
            duration: 4000,
          }
        );
      } else {
        toast.success(language === "es" ? "Split creado correctamente." : "Split created successfully!", {
          duration: 3000,
        });
      }

      navigate("/confirmation", {
        state: {
          id: response.data.id,
          title: splitData.title,
          amount: splitData.amount,
          people: splitData.people,
          isRecurring: false,
        },
      });
    } catch (error: any) {
      console.error("Error creating split:", error);

      const message = error.response?.data?.message || "Failed to create split";
      toast.error(message, {
        duration: 3000,
      });
      if (error.response?.status === 402) {
        navigate("/wallet/deposit");
      }
    }
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="w-full max-w-[360px] max-h-[88vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-300 mb-1">
                  Quick Edit
                </p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">Update split review</h2>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 font-black"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftAmount}
                    onChange={(event) => setDraftAmount(event.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-9 pr-4 py-4 text-gray-900 dark:text-gray-50 font-black text-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Split method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "equal", label: "Equal" },
                    { id: "fixed", label: "Fixed" },
                    { id: "percentage", label: "%" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDraftMethod(option.id)}
                      className={`rounded-2xl p-3 text-sm font-black border transition-all ${
                        draftMethod === option.id
                          ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-950 border-gray-900 dark:border-gray-50"
                          : "bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-2">
                  Changing the method will rebalance the current participants evenly for this review.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Participants</label>
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {isLoadingUsers ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4 font-medium">
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4 font-medium">
                      No other accounts yet.
                    </div>
                  ) : (
                    availableUsers.map((user) => {
                      const isSelected = draftSelectedUserIds.includes(user.id);

                      return (
                        <button
                          type="button"
                          key={user.id}
                          onClick={() => toggleDraftUser(user.id)}
                          className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left border-2 transition-all ${
                            isSelected
                              ? "border-gray-900 dark:border-gray-50 bg-gray-900/5 dark:bg-gray-50/10"
                              : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
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

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 font-black active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEdit}
                className="rounded-2xl p-4 bg-emerald-500 text-white font-black active:scale-[0.98] transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-6 relative">
        <button
          onClick={openEditModal}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors"
        >
          <Edit2 size={16} />
        </button>

        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-900">
          <Receipt size={28} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-1">{splitData.title}</h2>
        <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">${totalAmount.toFixed(2)}</p>

        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="px-4 py-2.5 bg-blue-50/80 text-blue-700 rounded-xl text-sm font-bold shadow-sm border border-blue-100/50 flex items-center justify-center">
            {getPayerLabel()}
          </div>
          <div className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-100 flex items-center justify-center uppercase tracking-wider">
            Method: {getMethodLabel()}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="font-bold text-gray-900 text-lg">Breakdown</h3>
          <button
            onClick={openEditModal}
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {["me", ...splitData.people.map((p: any) => p.id)].map((id, index, arr) => {
            const person = id === "me" ? { name: "You" } : splitData.people.find((p: any) => p.id === id);

            let displayValue = 0;
            if (splitData.method === "equal") {
              displayValue = totalAmount / arr.length;
            } else if (splitData.method === "percentage") {
              const pct = parseFloat(splitData.assignedValues[id]) || 0;
              displayValue = totalAmount * (pct / 100);
            } else {
              displayValue = parseFloat(splitData.assignedValues[id]) || 0;
            }

            return (
              <div
                key={id}
                className={`p-4 flex items-center justify-between ${
                  index !== arr.length - 1 ? "border-b border-gray-50" : ""
                } ${id === "me" ? "bg-gray-50/50" : ""}`}
              >
                <span className={`font-bold ${id === "me" ? "text-gray-900" : "text-gray-600"}`}>
                  {person?.name}
                </span>
                <div className="text-right">
                  <span className={`font-black text-lg ${id === "me" ? "text-gray-900" : "text-gray-700"}`}>
                    ${displayValue.toFixed(2)}
                  </span>
                  {splitData.method === "percentage" && (
                    <div className="text-xs font-bold text-gray-400 mt-0.5">
                      {splitData.assignedValues[id] || 0}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button
          onClick={handleCreate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <CheckCircle size={24} />
          Create Split
        </button>
      </div>
    </div>
  );
}
