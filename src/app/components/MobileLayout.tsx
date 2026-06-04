import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { ChevronLeft, X } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useLanguage } from "../context/LanguageContext";

export function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isHome = location.pathname === "/home";
  const isLogin = location.pathname === "/";
  const isNewFlow = location.pathname.startsWith("/new");
  const isHouseholdNewFlow = location.pathname.startsWith("/household/new");

  const getTitle = () => {
    switch (location.pathname) {
      case "/": return t("quicksplit");
      case "/signup": return t("signUp");
      case "/home": return t("quicksplit");
      case "/new": return t("newSplit");
      case "/new/scan": return "Scan Receipt";
      case "/new/people": return "Select People";
      case "/new/method": return "Split Method";
      case "/new/assign": return "Assign Amounts";
      case "/new/who-paid": return "Who Paid?";
      case "/new/review": return "Review Split";
      case "/household": return t("householdExpenses");
      case "/household/new": return "New Expense";
      case "/notifications": return t("notifications");
      case "/profile/change-password": return t("changePasswordTitle");
      default:
        if (location.pathname.startsWith("/split/")) return t("splitDetails");
        if (location.pathname.startsWith("/household/")) return "Expense Details";
        return "Quicksplit";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center sm:py-8 font-sans transition-colors">
      <div className="w-full h-full max-w-[400px] sm:h-[800px] bg-gray-50 dark:bg-gray-950 sm:rounded-[2.5rem] sm:border-[8px] border-gray-900 dark:border-gray-800 overflow-hidden relative shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shrink-0 sticky top-0 z-10 transition-colors">
          {!isHome && !isLogin ? (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-gray-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-10"></div>
          )}
          
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{getTitle()}</h1>
          
          {(isNewFlow || isHouseholdNewFlow) ? (
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-gray-800 transition-colors">
                  <X size={24} />
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
                <AlertDialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90%] max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-white p-6 shadow-xl z-50 animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                  <AlertDialog.Title className="text-xl font-bold text-gray-900 mb-2">Cancel creation?</AlertDialog.Title>
                  <AlertDialog.Description className="text-gray-500 mb-6 font-medium">
                    Are you sure you want to discard this and return to the home screen? All progress will be lost.
                  </AlertDialog.Description>
                  <div className="flex flex-col gap-3">
                    <AlertDialog.Action asChild>
                      <button 
                        onClick={() => navigate("/home")}
                        className="w-full bg-red-500 text-white rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all"
                      >
                        Yes, discard
                      </button>
                    </AlertDialog.Action>
                    <AlertDialog.Cancel asChild>
                      <button className="w-full bg-gray-100 text-gray-900 rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all">
                        Keep editing
                      </button>
                    </AlertDialog.Cancel>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          ) : (
            <div className="w-10"></div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8 bg-gray-50 dark:bg-gray-950 transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
