import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Receipt, Home as HomeIcon, CheckCircle2, CircleDashed } from "lucide-react";

export function HomeScreen() {
  const navigate = useNavigate();
  const [isEmptyState, setIsEmptyState] = useState(false);

  return (
    <div className="p-6 space-y-8 flex flex-col min-h-full">
      {isEmptyState ? (
        <>
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">You owe</p>
              <p className="text-2xl font-black text-gray-400">$0.00</p>
            </div>
            <div className="flex-1 bg-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">You are owed</p>
              <p className="text-2xl font-black text-gray-400">$0.00</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-6">
              <Receipt size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No splits yet</h2>
            <p className="text-gray-500 font-medium mb-8 max-w-[250px]">
              Create your first split to start sharing expenses with friends.
            </p>
            <button 
              onClick={() => navigate('/new')}
              className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all"
            >
              <Plus size={24} />
              Create your first split
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Balances */}
          <div className="flex gap-4">
            <div className="flex-1 bg-red-50/80 rounded-2xl p-4 border border-red-100/50 shadow-sm">
              <p className="text-xs font-bold text-red-600 mb-1 uppercase tracking-wider">You owe</p>
              <p className="text-2xl font-black text-red-700">$24.50</p>
            </div>
            <div className="flex-1 bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100/50 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">You are owed</p>
              <p className="text-2xl font-black text-emerald-700">$68.25</p>
            </div>
          </div>

          {/* Primary Action */}
          <button 
            onClick={() => navigate('/new')}
            className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all"
          >
            <Plus size={24} />
            New Split
          </button>

          {/* Shortcuts */}
          <button
            onClick={() => navigate('/household')}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <HomeIcon size={24} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-gray-900">Household Expenses</h3>
              <p className="text-sm text-gray-500 font-medium">View recurring bills & balances</p>
            </div>
          </button>

          {/* Recent Splits */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Recent Splits</h2>
            <div className="space-y-3">
              <SplitCard 
                title="Dinner at Mayagüez"
                amount="$84.75"
                status="2 pending"
                settled={false}
                onClick={() => navigate('/split/1')}
              />
              <SplitCard 
                title="Apartment WiFi"
                amount="$60.00"
                status="1 pending"
                settled={false}
                onClick={() => navigate('/split/2')}
              />
              <SplitCard 
                title="Groceries"
                amount="$42.60"
                status="Settled"
                settled={true}
                onClick={() => navigate('/split/3')}
              />
            </div>
          </div>
        </>
      )}

      {/* Dev Toggle */}
      <button 
        onClick={() => setIsEmptyState(!isEmptyState)}
        className="mt-auto pt-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center w-full"
      >
        Toggle {isEmptyState ? "Populated" : "Empty"} State
      </button>
    </div>
  );
}

function SplitCard({ title, amount, status, settled, onClick }: any) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${settled ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
        <Receipt size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <div className="flex items-center gap-1.5 mt-1">
          {settled ? <CheckCircle2 size={14} className="text-gray-400"/> : <CircleDashed size={14} className="text-orange-500"/>}
          <p className={`text-sm ${settled ? 'text-gray-500' : 'text-orange-600 font-medium'}`}>{status}</p>
        </div>
      </div>
      <div className="font-black text-gray-900">{amount}</div>
    </div>
  );
}
