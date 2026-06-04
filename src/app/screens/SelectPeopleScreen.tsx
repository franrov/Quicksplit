import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Check, User } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../api";

type AppUser = {
  id: number;
  name: string;
  email: string;
};

export function SelectPeopleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("quicksplitUser") || "null");
  const splitData = location.state || { title: "Unknown", amount: "0" };
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/", { replace: true });
      return;
    }

    axios
      .get(apiUrl(`/users?userId=${currentUser.id}`))
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Error loading users:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser?.id, navigate]);

  const toggleSelect = (id: number) => {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;

    const selectedFriends = users
      .filter((user) => selected.includes(user.id))
      .map((user) => ({
        id: `user-${user.id}`,
        userId: user.id,
        name: user.name,
        email: user.email,
      }));

    navigate("/new/method", {
      state: {
        ...splitData,
        people: selectedFriends,
      },
    });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Expense</p>
          <p className="font-bold text-gray-900 truncate max-w-[150px]">{splitData.title}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
          <p className="font-black text-gray-900">${splitData.amount}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Who's involved?</h2>
        <p className="text-gray-500 mt-2 font-medium">Select friends who already have QuickSplit accounts.</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">QuickSplit Users</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8 font-medium">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-8 font-medium">
              No other accounts yet. Ask your friend to sign up first.
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selected.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelect(user.id)}
                  className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2 ${
                    isSelected ? "border-gray-900 bg-gray-900/5 shadow-sm" : "border-transparent bg-white shadow-sm hover:border-gray-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`block text-lg truncate ${isSelected ? "font-black text-gray-900" : "font-bold text-gray-700"}`}>
                      {user.name}
                    </span>
                    <span className="block text-sm text-gray-400 truncate">{user.email}</span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      isSelected ? "bg-gray-900 border-gray-900" : "border-gray-200"
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 mt-auto border-t border-gray-100 bg-gray-50/80 -mx-6 px-6 backdrop-blur-md">
        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue
          {selected.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm ml-2">{selected.length} selected</span>
          )}
        </button>
      </div>
    </div>
  );
}
