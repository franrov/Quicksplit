import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Check, User } from "lucide-react";

const FRIENDS = [
  { id: '1', name: 'Gabriel' },
  { id: '2', name: 'Edward' },
  { id: '3', name: 'Ignacio' },
  { id: '4', name: 'Andrea' },
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
    const selectedFriends = FRIENDS.filter(f => selected.includes(f.id));
    navigate('/new/review', { 
      state: { 
        ...splitData,
        people: selectedFriends 
      } 
    });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Who's involved?</h2>
        <p className="text-gray-500 mt-2 font-medium">Select friends to split the cost with.</p>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {FRIENDS.map(friend => {
          const isSelected = selected.includes(friend.id);
          return (
            <div 
              key={friend.id}
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

      <div className="pt-8 pb-4">
        <button 
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          Continue ({selected.length} selected)
        </button>
      </div>
    </div>
  );
}
