import { useNavigate } from "react-router";
import { Receipt, Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function SplitDetailsScreen() {
  const navigate = useNavigate();
  
  // Hardcoded for prototype based on prompt
  const title = "Dinner at Mayagüez";
  const amount = "84.75";
  const participants = [
    { id: '1', name: 'Francisco (You)', status: 'paid', amount: '28.25' },
    { id: '2', name: 'Gabriel', status: 'pending', amount: '28.25' },
    { id: '3', name: 'Edward', status: 'pending', amount: '28.25' },
  ];

  const handleRemind = () => {
    toast("Reminder sent", {
      icon: <Bell className="w-5 h-5 text-blue-500" />,
      duration: 2000,
    });
  };

  const handleSettle = () => {
    toast.success("Split marked as settled", { duration: 2000 });
    navigate(-1);
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 text-emerald-600">
          <Receipt size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-2">{title}</h2>
        <p className="text-5xl font-black text-gray-900 tracking-tight">${amount}</p>
        <div className="mt-4 px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-bold border border-orange-100">
          2 pending payments
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <h3 className="font-bold text-gray-900 px-2 text-lg">Participants</h3>
        <div className="space-y-3">
          {participants.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                  p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{p.name}</p>
                  <p className={`text-sm font-bold capitalize ${p.status === 'paid' ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {p.status}
                  </p>
                </div>
              </div>
              <span className="font-black text-gray-900 text-lg">${p.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 pb-4 mt-auto flex gap-4">
        <button 
          onClick={handleRemind}
          className="flex-1 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl p-4 font-bold text-lg shadow-sm active:bg-gray-50 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <Bell size={20} />
          Remind
        </button>
        <button 
          onClick={handleSettle}
          className="flex-1 bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <CheckCircle2 size={20} />
          Settle All
        </button>
      </div>
    </div>
  );
}
