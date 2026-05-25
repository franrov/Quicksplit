import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { User, Users, HandCoins, CheckCircle2 } from "lucide-react";

export function WhoPaidScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || { title: 'Unknown', amount: '0', people: [], method: 'equal', assignedValues: {} };
  
  const [payer, setPayer] = useState<"me" | "other" | "multiple">("me");

  const handleContinue = () => {
    navigate('/new/review', { 
      state: { 
        ...splitData,
        payer
      } 
    });
  };

  const options = [
    { id: "me", label: "I paid upfront", description: "You covered the whole bill", icon: User },
    { id: "other", label: "Someone else paid", description: "Another person covered the bill", icon: HandCoins },
    { id: "multiple", label: "Multiple people paid", description: "The bill was split at the register", icon: Users },
  ];

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Who paid?</h2>
        <p className="text-gray-500 mt-2 font-medium">Select who covered this expense upfront.</p>
      </div>

      <div className="space-y-4 flex-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = payer === opt.id;
          
          return (
            <div 
              key={opt.id}
              onClick={() => setPayer(opt.id as any)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                isSelected ? 'border-gray-900 bg-gray-900/5 shadow-sm' : 'border-transparent bg-white shadow-sm hover:border-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-gray-900 text-white' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg ${isSelected ? 'font-black text-gray-900' : 'font-bold text-gray-900'}`}>{opt.label}</h3>
                <p className={`text-sm mt-0.5 ${isSelected ? 'text-gray-600 font-medium' : 'text-gray-500 font-medium'}`}>{opt.description}</p>
              </div>
              {isSelected && (
                <CheckCircle2 size={24} className="text-gray-900 shrink-0" strokeWidth={2.5} />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 mt-auto">
        <button 
          onClick={handleContinue}
          className="w-full bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all"
        >
          Review Split
        </button>
      </div>
    </div>
  );
}
