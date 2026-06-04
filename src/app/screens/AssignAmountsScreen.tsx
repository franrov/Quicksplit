import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { AlertCircle, User } from "lucide-react";

export function AssignAmountsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const splitData = location.state || { title: 'Unknown', amount: '0', people: [], method: 'equal' };
  
  const totalAmount = parseFloat(splitData.amount) || 0;
  const allParticipants = [{ id: 'me', name: 'You' }, ...splitData.people];
  
  // State for values assigned
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize default values based on method
    if (splitData.method === 'equal') {
      const equalShare = (totalAmount / allParticipants.length).toFixed(2);
      const initialValues: Record<string, string> = {};
      allParticipants.forEach(p => {
        initialValues[p.id] = equalShare;
      });
      // Handle penny rounding error if needed, but keeping it simple for MVP
      setValues(initialValues);
    } else {
      const initialValues: Record<string, string> = {};
      allParticipants.forEach(p => {
        initialValues[p.id] = '';
      });
      setValues(initialValues);
    }
  }, [splitData.method, totalAmount]);

  const handleValueChange = (id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
  };

  // Validation
  let isValid = false;
  let validationMessage = "";
  let currentTotal = 0;

  if (splitData.method === 'fixed' || splitData.method === 'equal') {
    currentTotal = Object.values(values).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const difference = Math.abs(currentTotal - totalAmount);
    if (difference > 0.05) { // allow small penny rounding
      isValid = false;
      validationMessage = `Total assigned ($${currentTotal.toFixed(2)}) must equal $${totalAmount.toFixed(2)}`;
    } else {
      isValid = true;
    }
  } else if (splitData.method === 'percentage') {
    currentTotal = Object.values(values).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    if (Math.abs(currentTotal - 100) > 0.1) {
      isValid = false;
      validationMessage = `Total percentage (${currentTotal}%) must equal 100%`;
    } else {
      isValid = true;
    }
  }

  const handleContinue = () => {
    if (!isValid) return;
    navigate('/new/who-paid', { 
      state: { 
        ...splitData,
        assignedValues: values
      } 
    });
  };

  return (
    <div className="p-6 flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      
      <div className="flex flex-col items-center bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          {splitData.method === 'equal' ? 'Splitting Equally' : 
           splitData.method === 'percentage' ? 'Splitting by Percentage' : 
           'Splitting Fixed Amounts'}
        </p>
        <p className="text-4xl font-black text-gray-900 mb-1">${totalAmount.toFixed(2)}</p>
        <p className="font-medium text-gray-500">{splitData.title}</p>
        
        {/* Progress / Remaining */}
        {splitData.method !== 'equal' && (
          <div className={`mt-4 px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${
            isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {!isValid && <AlertCircle size={16} />}
            {splitData.method === 'fixed' 
              ? `${(totalAmount - currentTotal) > 0 ? '$' + (totalAmount - currentTotal).toFixed(2) + ' left to assign' : validationMessage || 'Total matches'}`
              : `${(100 - currentTotal) > 0 ? (100 - currentTotal).toFixed(0) + '% left to assign' : validationMessage || 'Total matches'}`
            }
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {allParticipants.map(person => (
          <div key={person.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              {person.id === 'me' ? <User size={20} /> : <span className="font-black">{person.name.charAt(0)}</span>}
            </div>
            <span className="font-bold text-gray-900 flex-1 truncate">{person.name}</span>
            
            <div className="relative w-[100px] shrink-0">
              {splitData.method === 'equal' ? (
                <div className="text-right font-black text-lg text-gray-900">
                  ${parseFloat(values[person.id] || '0').toFixed(2)}
                </div>
              ) : (
                <>
                  <span className={`absolute ${splitData.method === 'percentage' ? 'right-4' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500 font-bold`}>
                    {splitData.method === 'percentage' ? '%' : '$'}
                  </span>
                  <input 
                    type="number" 
                    value={values[person.id] || ''}
                    onChange={(e) => handleValueChange(person.id, e.target.value)}
                    placeholder="0"
                    className={`w-full bg-gray-50 border-2 border-transparent rounded-xl py-2 ${splitData.method === 'percentage' ? 'pl-4 pr-8 text-right' : 'pl-7 pr-4'} text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-gray-900 transition-all text-lg`}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-auto">
        <button 
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:shadow-none active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
