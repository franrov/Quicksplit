import { useNavigate, useLocation } from "react-router";
import { Receipt, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ReviewSplitScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || { title: 'Unknown', amount: '0', people: [] };
  
  const totalAmount = parseFloat(splitData.amount) || 0;
  const peopleCount = splitData.people.length + 1; // +1 for "me"
  const splitAmount = totalAmount / peopleCount;

  const handleCreate = () => {
    toast.success("Split created successfully!", {
      duration: 3000,
    });
    navigate('/');
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 text-gray-900">
          <Receipt size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-2">{splitData.title}</h2>
        <p className="text-5xl font-black text-gray-900 tracking-tight">${totalAmount.toFixed(2)}</p>
        <div className="mt-6 px-5 py-2.5 bg-blue-50/80 text-blue-700 rounded-full text-sm font-bold shadow-sm border border-blue-100/50">
          Francisco paid upfront
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-4 px-2 text-lg">Split Details</h3>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
            <span className="font-bold text-gray-900">You (Francisco)</span>
            <span className="font-black text-gray-900 text-lg">${splitAmount.toFixed(2)}</span>
          </div>
          {splitData.people.map((person: any, i: number) => (
            <div key={person.id} className={`p-5 flex items-center justify-between ${i !== splitData.people.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className="font-bold text-gray-600">{person.name}</span>
              <span className="font-bold text-gray-600 text-lg">${splitAmount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 pb-4 mt-auto">
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
