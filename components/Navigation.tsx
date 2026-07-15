"use client";

import { useRouter } from "next/navigation";
import { Target, CalendarDays, BarChart2, Notebook } from "lucide-react";

type ActiveTab = "goals" | "daily" | "reports" | "lab";

export default function Navigation({ active }: { active: ActiveTab }) {
  const router = useRouter();

  const tabs = [
    { id: "goals" as ActiveTab, icon: Target, href: "/" },
    { id: "daily" as ActiveTab, icon: CalendarDays, href: "/daily" },
    { id: "lab" as ActiveTab, icon: Notebook, href: "/lab" },
    { id: "reports" as ActiveTab, icon: BarChart2, href: "/reports" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 z-30 pointer-events-none">
      <div className="bg-white rounded-full shadow-xl px-3 py-2.5 flex items-center gap-1 pointer-events-auto"
           style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0a0a0a] text-white"
                  : "text-[#6b6b6b] hover:text-[#0a0a0a]"
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
