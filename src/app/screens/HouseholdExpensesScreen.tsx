import { Home, Zap, Wifi, ShoppingCart, CheckCircle2, CircleDashed } from "lucide-react";

export function HouseholdExpensesScreen() {
  
  const expenses = [
    { id: 1, title: 'Rent', amount: '1,200', icon: Home, paidBy: 'Ariana', status: 'paid' },
    { id: 2, title: 'WiFi', amount: '60', icon: Wifi, status: 'pending' },
    { id: 3, title: 'Electricity', amount: '135', icon: Zap, status: 'pending' },
    { id: 4, title: 'Groceries', amount: '72.40', icon: ShoppingCart, status: 'settled' },
  ];

  const balances = [
    { name: 'Ariana', amount: '96.35', type: 'owed' },
    { name: 'Gabriel', amount: '32.10', type: 'owes' },
    { name: 'Edward', amount: '32.10', type: 'owes' },
    { name: 'Ignacio', amount: '32.15', type: 'owes' },
  ];

  return (
    <div className="p-6 space-y-8 pb-12">
      
      {/* Monthly Balance Summary */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-4 px-1 tracking-tight">Monthly Balance</h2>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
          {balances.map((b, i) => (
            <div key={b.name} className={`flex items-center justify-between ${i !== balances.length - 1 ? 'pb-5 border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-black text-gray-600 shrink-0">
                  {b.name.charAt(0)}
                </div>
                <span className="font-bold text-gray-900 text-lg">{b.name}</span>
              </div>
              <div className={`font-black text-lg ${b.type === 'owed' ? 'text-emerald-600' : 'text-orange-500'}`}>
                <span className="text-sm font-bold opacity-80 mr-1.5">{b.type === 'owed' ? 'is owed' : 'owes'}</span> 
                ${b.amount}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shared Expenses */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-4 px-1 tracking-tight">This Month's Bills</h2>
        <div className="space-y-3">
          {expenses.map((exp) => {
            const Icon = exp.icon;
            return (
              <div key={exp.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${exp.status === 'settled' || exp.status === 'paid' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{exp.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {exp.status === 'settled' || exp.status === 'paid' ? (
                      <CheckCircle2 size={16} className="text-gray-400"/>
                    ) : (
                      <CircleDashed size={16} className="text-orange-500"/>
                    )}
                    <p className={`text-sm ${exp.status === 'settled' || exp.status === 'paid' ? 'text-gray-500 font-bold' : 'text-orange-600 font-bold'}`}>
                      {exp.paidBy ? `Paid by ${exp.paidBy}` : exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="font-black text-gray-900 text-xl">${exp.amount}</div>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  );
}
