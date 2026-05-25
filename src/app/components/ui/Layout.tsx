import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="relative w-full max-w-[400px] h-[850px] max-h-[100dvh] bg-gray-50 rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-gray-900 flex flex-col">
        {/* Status Bar Fake */}
        <div className="h-12 w-full bg-transparent flex items-center justify-between px-6 pt-2 z-10 shrink-0">
          <div className="text-sm font-semibold tracking-tight text-gray-800">9:41</div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded-full bg-gray-800" />
            <div className="w-4 h-4 rounded-full bg-gray-800" />
            <div className="w-6 h-3 rounded-sm bg-gray-800" />
          </div>
        </div>

        {/* Dynamic Header */}
        {!isHome && (
          <div className="px-4 py-2 flex items-center bg-gray-50 shrink-0">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1 text-blue-600"
            >
              <ChevronLeft size={24} />
              <span className="font-medium text-[17px]">Back</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-gray-50 pb-8">
          <Outlet />
        </div>
        
        {/* Bottom Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-gray-300 rounded-full z-20 pointer-events-none" />
      </div>
    </div>
  );
};
