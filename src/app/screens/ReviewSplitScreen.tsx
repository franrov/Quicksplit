import React from "react";
import { useNavigate, useLocation } from "react-router";
import { Receipt, CheckCircle, Edit2 } from "lucide-react";

export function ReviewSplitScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || {
    title: 'Unknown',
    amount: '0',
    people: [],
    method: 'equal',
    assignedValues: {},
    payer: 'me'
  };

  const totalAmount = parseFloat(splitData.amount) || 0;

  const getMethodLabel = () => {
    if (splitData.method === 'fixed') return "Fixed amounts";
    if (splitData.method === 'percentage') return "By percentage";
    return "Split equally";
  };

  const getPayerLabel = () => {
    if (splitData.payer === 'other') return "Someone else paid upfront";
    if (splitData.payer === 'multiple') return "Multiple people paid";
    return "You paid upfront";
  };

  const handleCreate = () => {
    // Navigate to confirmation screen, passing the split data
    navigate('/confirmation', {
      state: {
        title: splitData.title,
        amount: splitData.amount,
        people: splitData.people,
        isRecurring: false,
      }
    });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-6 relative">
        <button
          onClick={() => navigate('/new')}
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
            onClick={() => navigate(-2)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {['me', ...splitData.people.map((p: any) => p.id)].map((id, index, arr) => {
            const person = id === 'me' ? { name: 'You' } : splitData.people.find((p: any) => p.id === id);

            let displayValue = 0;
            if (splitData.method === 'equal') {
              displayValue = totalAmount / arr.length;
            } else if (splitData.method === 'percentage') {
              const pct = parseFloat(splitData.assignedValues[id]) || 0;
              displayValue = totalAmount * (pct / 100);
            } else {
              displayValue = parseFloat(splitData.assignedValues[id]) || 0;
            }

            return (
              <div
                key={id}
                className={`p-4 flex items-center justify-between ${index !== arr.length - 1 ? 'border-b border-gray-50' : ''} ${id === 'me' ? 'bg-gray-50/50' : ''}`}
              >
                <span className={`font-bold ${id === 'me' ? 'text-gray-900' : 'text-gray-600'}`}>{person?.name}</span>
                <div className="text-right">
                  <span className={`font-black text-lg ${id === 'me' ? 'text-gray-900' : 'text-gray-700'}`}>${displayValue.toFixed(2)}</span>
                  {splitData.method === 'percentage' && (
                    <div className="text-xs font-bold text-gray-400 mt-0.5">{splitData.assignedValues[id] || 0}%</div>
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
