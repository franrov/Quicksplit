import React from "react";

import { useNavigate } from "react-router";
import { Wifi, Bell, CheckCircle2, CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function HouseholdExpenseDetailScreen() {
  const navigate = useNavigate();
  
  // Hardcoded based on "WiFi" from prototype
  const title = "Apartment WiFi";
  const amount = "60.00";
  const frequency = "Monthly";
  const dueDate = "May 28th";
  
  const participants = [
    { id: '1', name: 'Ariana', status: 'paid', amount: '15.00', role: 'payer' },
    { id: '2', name: 'You', status: 'pending', amount: '15.00', role: 'member' },
    { id: '3', name: 'Gabriel', status: 'pending', amount: '15.00', role: 'member' },
    { id: '4', name: 'Edward', status: 'paid', amount: '15.00', role: 'member' },
  ];

  const handleRemind = () => {
    toast("Reminder sent to pending members", {
      icon: <Bell className="w-5 h-5 text-blue-500" />,
      duration: 2000,
    });
  };

  const handlePay = () => {
    toast.success("Your share marked as paid", { duration: 2000 });
    navigate(-1);
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-8 relative">
        <div className="absolute top-4 right-4 bg-gray-50 text-gray-500 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <RefreshCw size={12} strokeWidth={3} />
          {frequency}
        </div>

        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 text-blue-600">
          <Wifi size={36} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-500 mb-2">{title}</h2>
        <p className="text-5xl font-black text-gray-900 tracking-tight">${amount}</p>
        
        <div className="flex items-center gap-2 mt-4 text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded-full text-sm">
          <CalendarDays size={16} />
          Due {dueDate}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-gray-900 text-lg">Bill Members</h3>
          <span className="text-sm font-bold text-gray-400">2 pending</span>
        </div>
        <div className="space-y-3">
          {participants.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                  p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {p.name === 'You' ? <UserIcon size={20} /> : p.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-lg">{p.name}</p>
                    {p.role === 'payer' && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Pays Bill</span>
                    )}
                  </div>
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

      <div className="pt-4 mt-auto flex gap-4">
        <button 
          onClick={handleRemind}
          className="flex-1 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl p-4 font-bold text-lg shadow-sm active:bg-gray-50 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <Bell size={20} />
          Remind
        </button>
        <button 
          onClick={handlePay}
          className="flex-[1.5] bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <CheckCircle2 size={20} />
          Mark as Paid
        </button>
      </div>
    </div>
  );
}

import { User as UserIcon } from "lucide-react";
