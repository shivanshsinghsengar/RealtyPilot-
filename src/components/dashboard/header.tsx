"use client";

import { useState, useEffect } from "react";
import { Menu, LogOut, Clock } from "lucide-react";
import { formatInIST } from "@/lib/utils/date";
import { logoutAction } from "@/app/auth/actions";

interface HeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  initialTimeStr?: string;
  onMenuToggle: () => void;
}

export function DashboardHeader({ user, initialTimeStr = "", onMenuToggle }: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>(initialTimeStr);

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(formatInIST(new Date(), "dd MMM, hh:mm:ss a 'IST'"));
    };
    if (!initialTimeStr) updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [initialTimeStr]);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Menu Trigger + Timezone Display */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">
          <Clock className="h-3.5 w-3.5 text-brand-600" />
          <span>{timeStr || "Loading IST..."}</span>
          <span className="text-[10px] text-slate-400 font-semibold">(Asia/Kolkata)</span>
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 py-1 pr-1.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user.fullName}
            </div>
            <div className="text-[10px] font-medium text-slate-500 capitalize">
              {user.role.replace("_", " ")}
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user.fullName.slice(0, 2)}
          </div>
        </div>

        {/* Logout Form */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all flex items-center gap-1.5"
            title="Sign out of CRM"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
