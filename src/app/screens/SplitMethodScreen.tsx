import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Divide, FileDigit, Percent, CheckCircle2 } from "lucide-react";

export function SplitMethodScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || { title: 'Unknown', amount: '0', people: [] };
  
  const [method, setMethod] = useState<"equal" | "fixed" | "percentage">("equal");

  const handleContinue = () => {
    navigate('/new/assign', { 
      state: { 
        ...splitData,
        method
      } 
    });
  };

  const methods = [
    { id: "equal", label: "Split equally", description: "Everyone pays the exact same amount", icon: Divide },
    { id: "fixed", label: "Fixed amounts", description: "Assign specific dollar amounts to each person", icon: FileDigit },
    { id: "percentage", label: "By percentage", description: "Divide the total by percentages", icon: Percent },
  ];

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
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">How to split?</h2>
        <p className="text-gray-500 mt-2 font-medium">Choose a method to divide the expense.</p>
      </div>

      <div className="space-y-4 flex-1">
        {methods.map((m) => {
          const Icon = m.icon;
          const isSelected = method === m.id;
          
          return (
            <div 
              key={m.id}
              onClick={() => setMethod(m.id as any)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                isSelected ? 'border-gray-900 bg-gray-900/5 shadow-sm' : 'border-transparent bg-white shadow-sm hover:border-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'
              }`}>
                <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg ${isSelected ? 'font-black text-gray-900' : 'font-bold text-gray-900'}`}>{m.label}</h3>
                <p className={`text-sm mt-0.5 ${isSelected ? 'text-gray-600 font-medium' : 'text-gray-500 font-medium'}`}>{m.description}</p>
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
          Continue
        </button>
      </div>
    </div>
  );
}
