"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  MessageSquare,
  Search,
  BarChart3,
  Building,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads & Pipeline", href: "/dashboard/leads", icon: Users },
  { name: "Site Visits", href: "/dashboard/visits", icon: CalendarCheck },
  { name: "WhatsApp Inbox", href: "/dashboard/inbox", icon: MessageSquare },
  { name: "Lead Discovery", href: "/dashboard/discovery", icon: Search },
  { name: "Insights & Scoring", href: "/dashboard/insights", icon: BarChart3 },
  { name: "Bhopal Inventory", href: "/dashboard/projects", icon: Building },
  { name: "Security & Audit", href: "/dashboard/security", icon: ShieldCheck },
];

export function DashboardSidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-200">
      <div className="p-6">
        {/* Logo & Brand */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
              RP
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight">RealtyPilot</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Bhopal Real Estate CRM
              </div>
            </div>
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* RERA & Compliance Footer */}
      <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>DPDP & RERA Verified</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Residential plots & duplexes &bull; M.P. RERA Compliant
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-800 z-30">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
