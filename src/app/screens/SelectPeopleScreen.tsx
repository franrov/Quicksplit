import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Check, User, Users } from "lucide-react";

const FREQUENT_FRIENDS = [
  { id: '1', name: 'Gabriel' },
  { id: '2', name: 'Edward' },
];

const ALL_FRIENDS = [
  { id: '1', name: 'Gabriel' },
  { id: '2', name: 'Edward' },
  { id: '3', name: 'Ignacio' },
  { id: '4', name: 'Andrea' },
  { id: '5', name: 'Carlos' },
  { id: '6', name: 'Sofia' },
];

export function SelectPeopleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || { title: 'Unknown', amount: '0' };
  
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    const selectedFriends = ALL_FRIENDS.filter(f => selected.includes(f.id));
    navigate('/new/method', { 
      state: { 
        ...splitData,
        people: selectedFriends 
      } 
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
        <p className="text-gray-500 mt-2 font-medium">Select friends to split the cost with.</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Frequent Contacts */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Frequent</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
            {FREQUENT_FRIENDS.map(friend => {
              const isSelected = selected.includes(friend.id);
              return (
                <button
                  key={`freq-${friend.id}`}
                  onClick={() => toggleSelect(friend.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 min-w-[80px] rounded-2xl border-2 transition-all snap-start ${
                    isSelected ? 'border-gray-900 bg-gray-900/5 shadow-sm' : 'border-transparent bg-white shadow-sm hover:border-gray-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <User size={20} strokeWidth={2.5} />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check size={10} className="text-white" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>{friend.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* All Contacts */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">All Contacts</h3>
          <div className="space-y-3">
            {ALL_FRIENDS.map(friend => {
              const isSelected = selected.includes(friend.id);
              return (
                <div 
                  key={`all-${friend.id}`}
                  onClick={() => toggleSelect(friend.id)}
                  className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-gray-900 bg-gray-900/5 shadow-sm' : 'border-transparent bg-white shadow-sm hover:border-gray-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <span className={`flex-1 text-lg ${isSelected ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{friend.name}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-200'}`}>
                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              )
            })}
          </div>
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
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm ml-2">
              {selected.length} selected
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
