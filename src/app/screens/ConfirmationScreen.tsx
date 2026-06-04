import React from "react";
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle2, Home, ListChecks } from "lucide-react";
import confetti from "canvas-confetti";

export function ConfirmationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false);

  const splitData = location.state || {
    title: "Split",
    amount: "0",
    people: [],
    isRecurring: false,
  };

  const isRecurring = splitData.isRecurring || false;

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    setTimeout(() => {
      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#10b981", "#059669", "#34d399"] });
      fire(0.2,  { spread: 60, colors: ["#6ee7b7", "#a7f3d0"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#111827", "#374151"] });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#10b981"] });
      fire(0.1,  { spread: 120, startVelocity: 45, colors: ["#d1fae5"] });
    }, 150);
  }, []);

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)] text-center">

      {/* Success icon */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-30" />
      </div>

      {/* Copy */}
      <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
        Split Successful!
      </h1>
      <p className="text-gray-500 font-medium mb-2 text-lg">
        <span className="font-bold text-gray-800">{splitData.title}</span>
      </p>
      <p className="text-gray-400 font-medium mb-10 text-sm">
        {isRecurring
          ? `This expense will be split every month automatically.`
          : `Payment requests have been sent to all participants.`}
      </p>

      {/* Summary pill */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 mb-10 w-full max-w-xs">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total split</p>
        <p className="text-3xl font-black text-gray-900">
          ${parseFloat(splitData.amount || "0").toFixed(2)}
        </p>
        {splitData.people?.length > 0 && (
          <p className="text-sm text-gray-400 font-medium mt-1">
            among {splitData.people.length + 1} people
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        {isRecurring ? (
          <button
            onClick={() => navigate("/household")}
            className="w-full bg-emerald-500 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ListChecks size={22} />
            View Recurring Splits
          </button>
        ) : (
          <button
            onClick={() => navigate("/split/new", { replace: true })}
            className="w-full bg-emerald-500 text-white rounded-2xl p-4 font-bold text-lg shadow-[0_8px_30px_rgb(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ListChecks size={22} />
            View Summary
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full bg-gray-100 text-gray-800 rounded-2xl p-4 font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Home size={22} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
