import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CalendarDays, Repeat } from "lucide-react";

export function AddRecurringExpenseScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");

  const handleCreate = () => {
    if (!title || !amount) return;
    toast.success("Recurring expense created", {
      duration: 3000,
    });
    navigate('/household');
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">New recurring bill</h2>
        <p className="text-gray-500 mt-2 font-medium">Add a household expense that repeats.</p>
      </div>

      <div className="space-y-5 flex-1">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Bill Name</label>
          <input 
            type="text" 
            placeholder="e.g. Rent, Internet, Spotify" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Frequency</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Repeat size={20} />
            </span>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm appearance-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">First Payment Date</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <CalendarDays size={20} />
            </span>
            <input 
              type="date" 
              className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-sm font-bold text-blue-800 mb-1">Who's paying?</p>
          <p className="text-xs font-medium text-blue-600">For MVP prototype, the bill will automatically split evenly among frequent contacts.</p>
        </div>
      </div>

      <div className="pt-8 pb-4 mt-auto">
        <button 
          onClick={handleCreate}
          disabled={!title || !amount}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          Create recurring expense
        </button>
      </div>
    </div>
  );
}
