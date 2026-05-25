import { useState } from "react";
import { useNavigate } from "react-router";
import { Camera } from "lucide-react";

export function NewSplitScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const handleScan = () => {
    navigate('/new/scan');
  };

  const handleContinue = () => {
    if (!title || !amount) return;
    navigate('/new/people', { state: { title, amount } });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="space-y-6 flex-1">
        
        {/* Scan Option */}
        <button 
          onClick={handleScan}
          className="w-full bg-blue-50/50 border-2 border-blue-200 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-blue-600 hover:bg-blue-50 active:scale-[0.98] transition-all"
        >
          <Camera size={36} strokeWidth={1.5} />
          <span className="font-bold">Scan Receipt</span>
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">or enter manually</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">What was this for?</label>
            <input 
              type="text" 
              placeholder="e.g. Dinner, Uber, Groceries" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">How much?</label>
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
        </div>
      </div>

      <div className="pt-8 pb-4">
        <button 
          onClick={handleContinue}
          disabled={!title || !amount}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
