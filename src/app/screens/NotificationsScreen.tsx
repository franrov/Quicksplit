import React from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCircle2, Clock, ArrowRight } from "lucide-react";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "reminder",
    title: "Ignacio owes you $30.00",
    subtitle: '"Club" · Due today',
    time: "10:30pm",
    read: false,
    section: "Today",
  },
  {
    id: 2,
    type: "paid",
    title: "Edward paid $20.6",
    subtitle: '"Chilis"',
    time: "9:15am",
    read: false,
    section: "Today",
  },
  {
    id: 3,
    type: "reminder",
    title: "Rent - April",
    subtitle: "Expires in 2 days",
    time: "Yesterday",
    read: true,
    section: "Yesterday",
  },
  {
    id: 4,
    type: "paid",
    title: "Gabriel paid $20.6",
    subtitle: '"Chilis"',
    time: "Yesterday",
    read: true,
    section: "Yesterday",
  },
  {
    id: 5,
    type: "reminder",
    title: "WiFi bill upcoming",
    subtitle: "Internet-apa · Due in 5 days",
    time: "Mon",
    read: true,
    section: "This Week",
  },
];

export function NotificationsScreen() {
  const navigate = useNavigate();

  const sections = ["Today", "Yesterday", "This Week"];

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(800px-80px)]">
      {/* Filter tabs */}
      <div className="flex gap-2 px-6 pt-5 pb-3 border-b border-gray-100">
        <button className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-sm font-bold">
          All
        </button>
        <button className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-bold">
          Reminders
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {sections.map((section) => {
          const items = NOTIFICATIONS.filter((n) => n.section === section);
          if (!items.length) return null;

          return (
            <div key={section}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {section}
              </p>
              <div className="space-y-2">
                {items.map((notif) => (
                  <NotifCard key={notif.id} notif={notif} onPress={() => navigate("/")} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotifCard({ notif, onPress }: { notif: any; onPress: () => void }) {
  const isPaid = notif.type === "paid";

  return (
    <div
      onClick={onPress}
      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${
        notif.read
          ? "bg-white border-gray-100"
          : "bg-emerald-50/50 border-emerald-100/80 shadow-sm"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isPaid ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        {isPaid ? <CheckCircle2 size={20} /> : <Clock size={20} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${notif.read ? "text-gray-700" : "text-gray-900"}`}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{notif.subtitle}</p>
      </div>

      {/* Time + unread dot */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-xs text-gray-400 font-medium">{notif.time}</p>
        {!notif.read && (
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </div>
    </div>
  );
}
