import { Outlet, useNavigate, useLocation } from "react-router";
import { ChevronLeft } from "lucide-react";

export function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const getTitle = () => {
    switch (location.pathname) {
      case "/": return "Quicksplit";
      case "/new": return "New Split";
      case "/new/people": return "Select People";
      case "/new/review": return "Review Split";
      case "/household": return "Household Expenses";
      default:
        if (location.pathname.startsWith("/split/")) return "Split Details";
        return "Quicksplit";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center sm:py-8 font-sans">
      <div className="w-full h-full max-w-[400px] sm:h-[800px] bg-gray-50 sm:rounded-[2.5rem] sm:border-[8px] border-gray-900 overflow-hidden relative shadow-2xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
          {!isHome ? (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-10"></div>
          )}
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{getTitle()}</h1>
          <div className="w-10"></div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8 bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
