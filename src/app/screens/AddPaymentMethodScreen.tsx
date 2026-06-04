import React from "react"; 
import { useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, Save } from "lucide-react";
import { toast } from "sonner";

export function AddPaymentMethodScreen() {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const canSave = cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3 && name.trim();

  const handleSave = () => {
    toast.success("Card added successfully!");
    navigate(-1);
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">

      {/* Card preview */}
      <div className="relative mb-8 mx-auto w-full max-w-xs">
        <div className="bg-gray-900 rounded-3xl p-6 aspect-[1.586/1] flex flex-col justify-between shadow-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="flex justify-between items-start relative z-10">
            <CreditCard size={28} className="text-white/60" strokeWidth={1.5} />
            <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-full bg-red-400/80" />
              <div className="w-5 h-5 rounded-full bg-yellow-400/60 -ml-2" />
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mb-1">Card Number</p>
            <p className="text-white font-mono text-lg tracking-widest font-bold">
              {cardNumber || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Name</p>
                <p className="text-white font-bold text-sm mt-0.5">{name || "YOUR NAME"}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Expires</p>
                <p className="text-white font-bold text-sm mt-0.5">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan or enter */}
      <div className="space-y-4 flex-1">
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-mono font-bold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Expires</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">CVV</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Name on Card</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
          />
        </div>

        {/* Save toggle */}
        <div
          onClick={() => setSaveInfo(!saveInfo)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${saveInfo ? "bg-gray-900 border-gray-900" : "border-gray-300 bg-white"}`}>
            {saveInfo && <svg width="12" height="9" fill="none" viewBox="0 0 12 9"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className="text-sm font-bold text-gray-700">Save card information</span>
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Save Card
        </button>
      </div>
    </div>
  );
}
