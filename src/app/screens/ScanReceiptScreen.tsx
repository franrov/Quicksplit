import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanLine, Loader2 } from "lucide-react";

export function ScanReceiptScreen() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);
  const [title, setTitle] = useState("Walmart Groceries");
  const [amount, setAmount] = useState("42.60");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (!title || !amount) return;
    navigate('/new/people', { state: { title, amount } });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      {isScanning ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 relative overflow-hidden">
            <ScanLine size={40} className="relative z-10" />
            <div className="absolute inset-0 bg-blue-200/50 animate-pulse"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <p className="text-gray-500 font-bold animate-pulse flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Scanning receipt...
          </p>
          <style>{`
            @keyframes scan {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(96px); }
            }
          `}</style>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
              <ScanLine size={32} />
            </div>
            <h2 className="text-xl font-bold text-emerald-800 mb-1">Receipt Scanned</h2>
            <p className="text-emerald-600 font-medium text-sm">We've extracted the details below. Please verify them.</p>
          </div>

          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Name</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Total Amount</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 pb-4">
            <button 
              onClick={handleContinue}
              disabled={!title || !amount}
              className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
            >
              Continue with these details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
